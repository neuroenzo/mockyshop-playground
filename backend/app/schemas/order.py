from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: Decimal
    product: dict

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {},
            "description": "Empty body — order is created from the current cart",
        }
    )


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    total_amount: Decimal
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(paid|shipped|delivered|cancelled)$",
        description="New order status",
    )


class OrderSortBy(StrEnum):
    NEWEST = "newest"
    OLDEST = "oldest"
    AMOUNT_ASC = "amount_asc"
    AMOUNT_DESC = "amount_desc"


class OrderFilter(BaseModel):
    status: str | None = None
    user_id: int | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None
    sort_by: OrderSortBy = OrderSortBy.NEWEST
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class OrderPaginatedResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    size: int
    pages: int
