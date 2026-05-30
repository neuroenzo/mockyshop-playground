from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import Category as CategorySchema
from app.schemas import CategoryCreate
from app.services.categories import CategoryService

router = APIRouter(
    prefix="/categories",
    tags=["categories"],
)


@router.get("/", response_model=list[CategorySchema])
@router.get("", response_model=list[CategorySchema], include_in_schema=False)
async def get_all_categories(db: AsyncSession = Depends(get_async_db)):
    """
    Returns a list of all active categories.
    """
    service = CategoryService(db)

    return await service.get_all_categories()


@router.post("/", response_model=CategorySchema, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=CategorySchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Creates a new category.
    """
    service = CategoryService(db)

    return await service.create_category(category)


@router.put("/{category_id}", response_model=CategorySchema)
async def update_category(
    category_id: int,
    category: CategoryCreate,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Updates a category by its ID.
    """
    service = CategoryService(db)

    return await service.update_category(category_id, category)


@router.delete("/{category_id}", response_model=CategorySchema)
async def delete_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Performs a soft delete of a category by its ID, setting is_active = False.
    """
    service = CategoryService(db)

    return await service.delete_category(category_id)
