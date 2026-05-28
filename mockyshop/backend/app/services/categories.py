from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.categories import Category as CategoryModel
from app.schemas import CategoryCreate


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_categories(self) -> list[CategoryModel]:
        result = await self.db.scalars(select(CategoryModel).where(CategoryModel.is_active))

        return list(result.all())

    async def create_category(self, data: CategoryCreate) -> CategoryModel:
        if data.parent_id is not None:
            result = await self.db.scalars(
                select(CategoryModel).where(
                    CategoryModel.id == data.parent_id,
                    CategoryModel.is_active,
                )
            )
            parent = result.first()
            if parent is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found",
                )

        db_category = CategoryModel(**data.model_dump())
        self.db.add(db_category)
        await self.db.commit()
        await self.db.refresh(db_category)

        return db_category

    async def update_category(self, category_id: int, data: CategoryCreate) -> CategoryModel:
        result = await self.db.scalars(
            select(CategoryModel).where(
                CategoryModel.id == category_id,
                CategoryModel.is_active,
            )
        )
        db_category = result.first()
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        if data.parent_id is not None:
            parent_result = await self.db.scalars(
                select(CategoryModel).where(
                    CategoryModel.id == data.parent_id,
                    CategoryModel.is_active,
                )
            )
            parent = parent_result.first()
            if not parent:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent category not found",
                )
            if parent.id == category_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category cannot be its own parent",
                )

        update_data = data.model_dump(exclude_unset=True)
        await self.db.execute(
            update(CategoryModel).where(CategoryModel.id == category_id).values(**update_data)
        )
        await self.db.commit()
        await self.db.refresh(db_category)

        return db_category

    async def delete_category(self, category_id: int) -> CategoryModel:
        result = await self.db.scalars(
            select(CategoryModel).where(
                CategoryModel.id == category_id,
                CategoryModel.is_active,
            )
        )
        db_category = result.first()
        if not db_category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        await self.db.execute(
            update(CategoryModel).where(CategoryModel.id == category_id).values(is_active=False)
        )
        await self.db.commit()

        return db_category
