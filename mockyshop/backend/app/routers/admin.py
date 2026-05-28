from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import User as UserSchema
from app.schemas import UserAdminCreate as UserAdminCreateSchema
from app.services.admin import AdminService

router = APIRouter(
    prefix="/admin",
    tags=["admin"],
)


@router.get("/main", response_model=UserSchema)
async def get_admin_main(
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Return current admin profile."""
    service = AdminService(db)

    return await service.get_admin_main(admin)


@router.post("/users/{user_id}/make-admin", response_model=UserSchema)
async def make_admin(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Promote a user to admin."""
    service = AdminService(db)

    return await service.make_admin(user_id)


@router.post("/users/{user_id}/remove-admin", response_model=UserSchema)
async def remove_admin(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Remove admin role. Cannot remove the last admin."""
    service = AdminService(db)

    return await service.remove_admin(user_id, admin.id)


@router.post("/users/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
@router.post("/users", response_model=UserSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def admin_create_user(
    data: UserAdminCreateSchema,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Create a new user with any role (admin, seller, buyer)."""
    service = AdminService(db)

    return await service.create_user(data)


@router.delete("/users/{user_id}")
async def admin_delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Soft-delete a user by setting is_active to False. Cannot delete last admin."""
    service = AdminService(db)

    return await service.delete_user(user_id)
