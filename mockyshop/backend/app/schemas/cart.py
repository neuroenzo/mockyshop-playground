from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartItemBase(BaseModel):
    product_id: int = Field(..., description="Product ID")
    quantity: int = Field(..., ge=1, description="Quantity")


class CartItemCreate(CartItemBase):
    pass


class CartItemResponse(CartItemBase):
    id: int = Field(..., description="Cart item ID")
    product: dict = Field(..., description="Product data")

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int = Field(..., description="Cart ID")
    items: list[CartItemResponse] = Field(..., description="List of cart items")
    total_amount: Decimal = Field(..., description="Total cart amount")
    total_items: int = Field(..., description="Total number of items")

    model_config = ConfigDict(from_attributes=True)
