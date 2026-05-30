from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CheckoutItemResponse(BaseModel):
    product_id: int
    name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class CheckoutResponse(BaseModel):
    order_id: int
    status: str
    total_amount: Decimal
    items: list[CheckoutItemResponse]
    message: str


class PaymentCreate(BaseModel):
    payment_method: str = Field(
        ...,
        pattern="^(card|cash|mock)$",
        description="Payment method: 'card', 'cash', or 'mock'",
    )


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    amount: Decimal
    status: str
    payment_method: str
    transaction_id: str
    paid_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
