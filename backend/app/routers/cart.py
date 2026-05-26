from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_buyer
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import CartItemCreate, CartItemResponse, CartResponse
from app.services.cart import CartService

router = APIRouter(prefix="/cart", tags=["cart"])


@router.get("/", response_model=CartResponse)
@router.get("", response_model=CartResponse, include_in_schema=False)
async def get_cart(
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Retrieves current user's cart with items and totals."""
    service = CartService(db)

    return await service.get_cart(current_user.id)


@router.post(
    "/items",
    response_model=CartItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_item(
    item_data: CartItemCreate,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Adds a product to cart or increase quantity."""
    service = CartService(db)

    return await service.add_item(current_user.id, item_data.product_id, item_data.quantity)


@router.put("/items/{item_id}", response_model=CartItemResponse)
async def update_item_quantity(
    item_id: int,
    item_data: CartItemCreate,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Updates quantity of a specific cart item."""
    service = CartService(db)

    return await service.update_item_quantity(current_user.id, item_id, item_data.quantity)


@router.delete(
    "/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_item(
    item_id: int,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Removes a single item from cart."""
    service = CartService(db)
    await service.remove_item(current_user.id, item_id)


@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
async def clear_cart(
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Clears all items from cart."""
    service = CartService(db)
    await service.clear_cart(current_user.id)
