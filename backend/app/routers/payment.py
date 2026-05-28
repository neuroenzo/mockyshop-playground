from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_buyer
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import CheckoutResponse, PaymentCreate, PaymentResponse
from app.services.payment import PaymentService

router = APIRouter(prefix="/checkout", tags=["payments"])


@router.get("/{order_id}", response_model=CheckoutResponse)
async def get_checkout(
    order_id: int,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Return checkout summary for a pending order."""
    service = PaymentService(db)

    return await service.get_checkout(order_id, current_user)


@router.post(
    "/{order_id}/pay",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def pay_order(
    order_id: int,
    payment_data: PaymentCreate,
    current_user: UserModel = Depends(get_current_buyer),
    db: AsyncSession = Depends(get_async_db),
):
    """Process mock payment for an order."""
    service = PaymentService(db)

    return await service.process_payment(order_id, payment_data.payment_method, current_user)
