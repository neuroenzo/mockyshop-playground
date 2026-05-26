from math import ceil
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.categories import Category as CategoryModel
from app.models.products import Product as ProductModel
from app.schemas import ProductCreate, ProductFilter, ProductPaginatedResponse, ProductSortBy


class ProductService:
    _sort_mappings: dict[ProductSortBy, Any] = {
        ProductSortBy.PRICE_ASC: ProductModel.price.asc(),
        ProductSortBy.PRICE_DESC: ProductModel.price.desc(),
        ProductSortBy.NAME_ASC: ProductModel.name.asc(),
        ProductSortBy.NAME_DESC: ProductModel.name.desc(),
        ProductSortBy.NEWEST: ProductModel.created_at.desc(),
        ProductSortBy.OLDEST: ProductModel.created_at.asc(),
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_products(self, filter: ProductFilter) -> ProductPaginatedResponse:
        query = select(ProductModel).options(selectinload(ProductModel.images))

        if filter.search:
            query = query.where(
                ProductModel.ts_vector.op("@@")(func.websearch_to_tsquery("english", filter.search))
            )
        if filter.category_id is not None:
            query = query.where(ProductModel.category_id == filter.category_id)
        if filter.min_price is not None:
            query = query.where(ProductModel.price >= filter.min_price)
        if filter.max_price is not None:
            query = query.where(ProductModel.price <= filter.max_price)
        if filter.is_active is not None:
            query = query.where(ProductModel.is_active == filter.is_active)

        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.scalar(count_query) or 0

        order_clause = self._sort_mappings[filter.sort_by]
        query = query.order_by(order_clause)
        query = query.offset((filter.page - 1) * filter.size).limit(filter.size)

        result = await self.db.scalars(query)
        items = list(result.all())

        for item in items:
            if item.image_url is None and item.images:
                item.image_url = item.images[0].image_url

        pages = ceil(total / filter.size) if total else 0

        return ProductPaginatedResponse(
            items=items,
            total=total,
            page=filter.page,
            size=filter.size,
            pages=pages,
        )

    async def get_product(self, product_id: int) -> ProductModel:
        result = await self.db.scalars(
            select(ProductModel)
            .options(selectinload(ProductModel.images))
            .where(
                ProductModel.id == product_id,
                ProductModel.is_active,
            )
        )
        product = result.first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or inactive",
            )

        if product.image_url is None and product.images:
            product.image_url = product.images[0].image_url

        return product

    async def get_products_by_category(self, category_id: int) -> list[ProductModel]:
        category_result = await self.db.scalars(
            select(CategoryModel).where(
                CategoryModel.id == category_id,
                CategoryModel.is_active,
            )
        )
        if not category_result.first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found or inactive",
            )

        product_result = await self.db.scalars(
            select(ProductModel)
            .options(selectinload(ProductModel.images))
            .where(
                ProductModel.category_id == category_id,
                ProductModel.is_active,
            )
        )

        items = list(product_result.all())
        for item in items:
            if item.image_url is None and item.images:
                item.image_url = item.images[0].image_url

        return items

    async def create_product(self, data: ProductCreate, seller_id: int) -> ProductModel:
        category_result = await self.db.scalars(
            select(CategoryModel).where(
                CategoryModel.id == data.category_id,
                CategoryModel.is_active,
            )
        )
        if not category_result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found or inactive",
            )

        db_product = ProductModel(**data.model_dump(), seller_id=seller_id)
        self.db.add(db_product)
        await self.db.commit()
        await self.db.refresh(db_product)

        return db_product

    async def update_product(
        self, product_id: int, data: ProductCreate, seller_id: int, is_admin: bool = False
    ) -> ProductModel:
        result = await self.db.scalars(
            select(ProductModel).where(
                ProductModel.id == product_id,
                ProductModel.is_active,
            )
        )
        db_product = result.first()
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found",
            )

        if not is_admin and db_product.seller_id != seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own products",
            )

        category_result = await self.db.scalars(
            select(CategoryModel).where(
                CategoryModel.id == data.category_id,
                CategoryModel.is_active,
            )
        )
        if not category_result.first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found or inactive",
            )

        await self.db.execute(
            update(ProductModel).where(ProductModel.id == product_id).values(**data.model_dump())
        )
        await self.db.commit()
        await self.db.refresh(db_product)

        return db_product

    async def delete_product(self, product_id: int, seller_id: int, is_admin: bool = False) -> ProductModel:
        result = await self.db.scalars(
            select(ProductModel).where(
                ProductModel.id == product_id,
                ProductModel.is_active,
            )
        )
        product = result.first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or inactive",
            )

        if not is_admin and product.seller_id != seller_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own products",
            )

        await self.db.execute(
            update(ProductModel).where(ProductModel.id == product_id).values(is_active=False)
        )
        await self.db.commit()
        await self.db.refresh(product)

        return product
