from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user, get_current_buyer, get_current_seller, get_current_user
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import (
    OrderCreate,
    OrderFilter,
    OrderPaginatedResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.services.order import OrderService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_order(
    order_data: OrderCreate,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Creates an order from current cart, then clear the cart."""
    service = OrderService(db)

    return await service.create_order(current_user.id)


@router.get("/", response_model=OrderPaginatedResponse)
@router.get("", response_model=OrderPaginatedResponse, include_in_schema=False)
async def get_orders(
    filter: OrderFilter = Depends(),
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Returns a paginated, filtered list of orders based on user role."""
    service = OrderService(db)

    return await service.get_orders(filter, current_user)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: UserModel = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Returns a single order by ID."""
    service = OrderService(db)

    return await service.get_order(order_id, current_user)


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_data: OrderStatusUpdate,
    admin: UserModel = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Updates order status. Admin only."""
    service = OrderService(db)

    return await service.update_order_status(order_id, status_data.status, admin)


@router.patch("/{order_id}/ship", response_model=OrderResponse)
async def ship_order(
    order_id: int,
    seller: UserModel = Depends(get_current_seller),
    db: AsyncSession = Depends(get_async_db),
):
    """Marks order as shipped. Seller only."""
    service = OrderService(db)

    return await service.ship_order(order_id, seller)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(
    order_id: int,
    admin: UserModel = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Soft deleting an order. Admin only."""
    service = OrderService(db)
    await service.delete_order(order_id)
