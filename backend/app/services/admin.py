from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import hash_password
from app.models.users import User as UserModel
from app.schemas import UserAdminCreate


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_admin_main(self, admin: UserModel) -> UserModel:
        return admin

    async def create_user(self, data: UserAdminCreate) -> UserModel:
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

    async def delete_user(self, user_id: int) -> dict:
        result = await self.db.scalars(select(UserModel).where(UserModel.id == user_id))
        user = result.first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден",
            )

        if user.role == "admin":
            admin_count = await self.db.scalar(
                select(func.count()).select_from(UserModel).where(UserModel.role == "admin")
            )
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Невозможно удалить последнего администратора",
                )

        user.is_active = False
        await self.db.commit()

        return {"ok": True}

    async def make_admin(self, user_id: int) -> UserModel:
        result = await self.db.scalars(select(UserModel).where(UserModel.id == user_id))
        user = result.first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден",
            )

        if user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь уже является администратором",
            )

        user.role = "admin"
        await self.db.commit()
        await self.db.refresh(user)

        return user

    async def remove_admin(self, user_id: int, current_admin_id: int) -> UserModel:
        if current_admin_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нельзя снять роль администратора у самого себя",
            )

        result = await self.db.scalars(select(UserModel).where(UserModel.id == user_id))
        user = result.first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Пользователь не найден",
            )

        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Пользователь не является администратором",
            )

        admin_count = await self.db.scalar(
            select(func.count()).select_from(UserModel).where(UserModel.role == "admin")
        )
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Невозможно снять роль последнего администратора",
            )

        user.role = "buyer"
        await self.db.commit()
        await self.db.refresh(user)

        return user
