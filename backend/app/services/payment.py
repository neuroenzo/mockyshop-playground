import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.order import OrderItemModel, OrderModel
from app.models.payment import PaymentModel
from app.models.users import User as UserModel
from app.schemas import CheckoutItemResponse, CheckoutResponse, PaymentResponse


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_checkout(self, order_id: int, current_user: UserModel) -> CheckoutResponse:
        """Return checkout summary for a pending order."""

        result = await self.db.scalars(
            select(OrderModel)
            .options(
                joinedload(OrderModel.items).joinedload(OrderItemModel.product),
            )
            .where(
                OrderModel.id == order_id,
                OrderModel.user_id == current_user.id,
            )
        )
        order = result.unique().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot checkout order with status '{order.status}'. "
                    f"Only 'pending' orders can be checked out."
                ),
            )

        items = [
            CheckoutItemResponse(
                product_id=item.product_id,
                name=item.product.name,
                quantity=item.quantity,
                unit_price=item.price,
                total_price=item.price * item.quantity,
            )
            for item in order.items
        ]

        return CheckoutResponse(
            order_id=order.id,
            status=order.status,
            total_amount=order.total_amount,
            items=items,
            message="Please confirm your order and proceed to payment",
        )

    async def process_payment(
        self, order_id: int, payment_method: str, current_user: UserModel
    ) -> PaymentResponse:
        """Process mock payment for an order."""

        result = await self.db.scalars(
            select(OrderModel)
            .options(
                joinedload(OrderModel.items).joinedload(OrderItemModel.product),
            )
            .where(
                OrderModel.id == order_id,
                OrderModel.user_id == current_user.id,
            )
        )
        order = result.unique().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        if order.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot pay for order with status '{order.status}'. "
                    f"Only 'pending' orders can be paid."
                ),
            )

        existing_payment = await self.db.scalar(
            select(PaymentModel).where(PaymentModel.order_id == order_id)
        )
        if existing_payment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Order already has a payment record",
            )

        transaction_id = str(uuid.uuid4())

        payment = PaymentModel(
            order_id=order.id,
            amount=order.total_amount,
            status="paid",
            payment_method=payment_method,
            transaction_id=transaction_id,
            paid_at=datetime.now(UTC).replace(tzinfo=None),
        )
        self.db.add(payment)

        order.status = "paid"

        await self.db.commit()

        return PaymentResponse(
            id=payment.id,
            order_id=payment.order_id,
            amount=payment.amount,
            status=payment.status,
            payment_method=payment.payment_method,
            transaction_id=payment.transaction_id,
            paid_at=payment.paid_at,
            created_at=payment.created_at,
        )
