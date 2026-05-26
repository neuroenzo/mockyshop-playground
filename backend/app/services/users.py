from math import ceil
from typing import Any

from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, hash_password, verify_password
from app.models.users import User as UserModel
from app.schemas import UserCreate, UserFilter, UserPaginatedResponse, UserRoleUpdate, UserSortBy


class UserService:
    _sort_mappings: dict[UserSortBy, Any] = {
        UserSortBy.EMAIL: UserModel.email.asc(),
        UserSortBy.ROLE: UserModel.role.asc(),
        UserSortBy.ID_ASC: UserModel.id.asc(),
        UserSortBy.ID_DESC: UserModel.id.desc(),
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, data: UserCreate) -> UserModel:
        result = await self.db.scalars(select(UserModel).where(UserModel.email == data.email))
        if result.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        db_user = UserModel(
            email=data.email,
            hashed_password=hash_password(data.password.get_secret_value()),
            role=data.role,
        )
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)

        return db_user

    async def get_all_users(self, filter: UserFilter) -> UserPaginatedResponse:
        query = select(UserModel)

        if filter.search:
            pattern = f"%{filter.search}%"
            query = query.where(UserModel.email.ilike(pattern))
        if filter.role is not None:
            query = query.where(UserModel.role == filter.role)
        if filter.is_active is not None:
            query = query.where(UserModel.is_active == filter.is_active)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0

        order_clause = self._sort_mappings[filter.sort_by]
        query = query.order_by(order_clause)
        query = query.offset((filter.page - 1) * filter.size).limit(filter.size)

        result = await self.db.scalars(query)
        items = list(result.all())

        pages = ceil(total / filter.size) if total else 0

        return UserPaginatedResponse(
            items=items,
            total=total,
            page=filter.page,
            size=filter.size,
            pages=pages,
        )

    async def login(self, form_data: OAuth2PasswordRequestForm) -> dict:
        result = await self.db.scalars(
            select(UserModel).where(
                UserModel.email == form_data.username,
                UserModel.is_active,
            )
        )
        user = result.first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )

        return {"access_token": access_token, "token_type": "bearer"}

    async def update_user_role(self, user_id: int, role_data: UserRoleUpdate) -> UserModel:
        result = await self.db.scalars(select(UserModel).where(UserModel.id == user_id))
        user = result.first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден",
            )

        if user.role == "admin" and role_data.role != "admin":
            admin_count = await self.db.scalar(
                select(func.count()).select_from(UserModel).where(UserModel.role == "admin")
            )
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Невозможно снять роль администратора: должен остаться хотя бы один admin"
                    ),
                )

        user.role = role_data.role
        await self.db.commit()
        await self.db.refresh(user)

        return user
