from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(
        ..., min_length=3, max_length=100, description="Product name (3-100 characters)"
    )
    description: str | None = Field(
        None, max_length=500, description="Product description (up to 500 characters)"
    )
    price: Decimal = Field(
        ..., gt=0, description="Product price (greater than 0)", decimal_places=2
    )
    image_url: str | None = Field(None, max_length=200, description="Product image URL")
    stock: int = Field(..., ge=0, description="Stock quantity (0 or more)")
    category_id: int = Field(..., description="Category ID the product belongs to")


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: int = Field(..., description="Unique product identifier")
    is_active: bool = Field(..., description="Product activity status")
    created_at: datetime = Field(..., description="Product creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class ProductSortBy(StrEnum):
    PRICE_ASC = "price_asc"
    PRICE_DESC = "price_desc"
    NAME_ASC = "name_asc"
    NAME_DESC = "name_desc"
    NEWEST = "newest"
    OLDEST = "oldest"


class ProductFilter(BaseModel):
    search: str | None = None
    category_id: int | None = None
    min_price: Decimal | None = None
    max_price: Decimal | None = None
    is_active: bool | None = True
    sort_by: ProductSortBy = ProductSortBy.NEWEST
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class ProductPaginatedResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    size: int
    pages: int
