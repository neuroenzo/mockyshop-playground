from math import ceil
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import case, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.cart import CartItemModel, CartModel
from app.models.order import OrderItemModel, OrderModel
from app.models.products import Product as ProductModel
from app.models.users import User as UserModel
from app.schemas import (
    OrderFilter,
    OrderItemResponse,
    OrderPaginatedResponse,
    OrderResponse,
    OrderSortBy,
)


class OrderService:
    _sort_mappings: dict[OrderSortBy, Any] = {
        OrderSortBy.NEWEST: OrderModel.created_at.desc(),
        OrderSortBy.OLDEST: OrderModel.created_at.asc(),
        OrderSortBy.AMOUNT_ASC: OrderModel.total_amount.asc(),
        OrderSortBy.AMOUNT_DESC: OrderModel.total_amount.desc(),
    }

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _product_to_dict(product: ProductModel) -> dict:
        return {
            "id": product.id,
            "name": product.name,
            "price": product.price,
            "description": product.description,
            "image_url": product.image_url,
            "stock": product.stock,
        }

    async def create_order(self, user_id: int) -> OrderResponse:
        """Create an order from the user's cart, then clear the cart."""

        result = await self.db.scalars(
            select(CartModel)
            .options(
                joinedload(CartModel.items).joinedload(CartItemModel.product),
            )
            .where(CartModel.user_id == user_id)
        )
        cart = result.unique().first()

        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cart is empty",
            )

        for item in cart.items:
            product = item.product
            if not product.is_active:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product '{product.name}' is no longer available",
                )
            if item.quantity > product.stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Not enough stock for '{product.name}'. "
                        f"Available: {product.stock}, requested: {item.quantity}"
                    ),
                )

        cart_item_snapshots = [
            (item.product_id, item.quantity, item.product.price, item.product)
            for item in cart.items
        ]

        total_amount = sum(price * qty for _, qty, price, _ in cart_item_snapshots)

        order = OrderModel(
            user_id=user_id,
            total_amount=total_amount,
        )
        self.db.add(order)
        await self.db.flush()

        order_items = [
            OrderItemModel(
                order_id=order.id,
                product_id=pid,
                quantity=qty,
                price=price,
            )
            for pid, qty, price, _ in cart_item_snapshots
        ]
        self.db.add_all(order_items)

        await self.db.execute(delete(CartItemModel).where(CartItemModel.cart_id == cart.id))
        await self.db.delete(cart)

        await self.db.commit()

        items = [
            OrderItemResponse(
                id=order_items[i].id,
                product_id=pid,
                quantity=qty,
                price=price,
                product=self._product_to_dict(product),
            )
            for i, (pid, qty, price, product) in enumerate(cart_item_snapshots)
        ]

        return OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=items,
        )

    async def get_orders(
        self, filter: OrderFilter, current_user: UserModel
    ) -> OrderPaginatedResponse:
        """Return paginated, filtered orders based on user role."""

        # Role-based base query for IDs only (avoids joinedload pagination issues)
        id_query = select(OrderModel.id)

        if current_user.role == "admin":
            pass  # admin sees all
        elif current_user.role == "seller":
            seller_order_ids = (
                select(OrderItemModel.order_id)
                .join(ProductModel, OrderItemModel.product_id == ProductModel.id)
                .where(ProductModel.seller_id == current_user.id)
                .distinct()
                .subquery()
            )
            id_query = id_query.where(OrderModel.id.in_(select(seller_order_ids)))
        else:
            id_query = id_query.where(OrderModel.user_id == current_user.id)

        # Apply filters
        if filter.status is not None:
            id_query = id_query.where(OrderModel.status == filter.status)
        if filter.user_id is not None and current_user.role == "admin":
            id_query = id_query.where(OrderModel.user_id == filter.user_id)
        if filter.min_amount is not None:
            id_query = id_query.where(OrderModel.total_amount >= filter.min_amount)
        if filter.max_amount is not None:
            id_query = id_query.where(OrderModel.total_amount <= filter.max_amount)
        if filter.created_from is not None:
            id_query = id_query.where(OrderModel.created_at >= filter.created_from)
        if filter.created_to is not None:
            id_query = id_query.where(OrderModel.created_at <= filter.created_to)

        # Total count
        count_query = select(func.count()).select_from(id_query.subquery())
        total = await self.db.scalar(count_query) or 0

        # Sort
        order_clause = self._sort_mappings[filter.sort_by]
        id_query = id_query.order_by(order_clause)

        # Paginate
        id_query = id_query.offset((filter.page - 1) * filter.size).limit(filter.size)
        id_result = await self.db.scalars(id_query)
        order_ids = list(id_result.all())

        # Fetch orders with relationships by IDs (preserving paginated order)
        if order_ids:
            ordering = case(
                {id: idx for idx, id in enumerate(order_ids)},
                value=OrderModel.id,
            )
            stmt = (
                select(OrderModel)
                .options(
                    joinedload(OrderModel.items).joinedload(OrderItemModel.product),
                )
                .where(OrderModel.id.in_(order_ids))
                .order_by(ordering)
            )
            result = await self.db.scalars(stmt)
            orders = result.unique().all()
        else:
            orders = []

        pages = ceil(total / filter.size) if total else 0

        return OrderPaginatedResponse(
            items=[self._order_to_response(o) for o in orders],
            total=total,
            page=filter.page,
            size=filter.size,
            pages=pages,
        )

    async def get_order(self, order_id: int, current_user: UserModel) -> OrderResponse:
        """Return a single order based on user role."""

        stmt = select(OrderModel).options(
            joinedload(OrderModel.items).joinedload(OrderItemModel.product),
        )

        if current_user.role == "admin":
            stmt = stmt.where(OrderModel.id == order_id)

        elif current_user.role == "seller":
            seller_order_ids = (
                select(OrderItemModel.order_id)
                .join(ProductModel, OrderItemModel.product_id == ProductModel.id)
                .where(ProductModel.seller_id == current_user.id)
                .distinct()
                .subquery()
            )
            stmt = stmt.where(
                OrderModel.id == order_id,
                OrderModel.id.in_(select(seller_order_ids)),
            )

        else:
            stmt = stmt.where(
                OrderModel.id == order_id,
                OrderModel.user_id == current_user.id,
            )

        result = await self.db.scalars(stmt)
        order = result.unique().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        return self._order_to_response(order)

    async def update_order_status(
        self, order_id: int, new_status: str, current_user: UserModel
    ) -> OrderResponse:
        """Update order status. Admin can set any status."""

        stmt = (
            select(OrderModel)
            .options(
                joinedload(OrderModel.items).joinedload(OrderItemModel.product),
            )
            .where(OrderModel.id == order_id)
        )

        result = await self.db.scalars(stmt)
        order = result.unique().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        order.status = new_status
        await self.db.commit()
        await self.db.refresh(order)

        return self._order_to_response(order)

    async def ship_order(self, order_id: int, current_user: UserModel) -> OrderResponse:
        """Mark order as shipped. Seller can only ship orders with their products."""

        seller_order_ids = (
            select(OrderItemModel.order_id)
            .join(ProductModel, OrderItemModel.product_id == ProductModel.id)
            .where(ProductModel.seller_id == current_user.id)
            .distinct()
            .subquery()
        )

        stmt = (
            select(OrderModel)
            .options(
                joinedload(OrderModel.items).joinedload(OrderItemModel.product),
            )
            .where(
                OrderModel.id == order_id,
                OrderModel.id.in_(select(seller_order_ids)),
            )
        )

        result = await self.db.scalars(stmt)
        order = result.unique().first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found or contains no products from this seller",
            )

        allowed_statuses = {"paid"}
        if order.status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Cannot ship order with status '{order.status}'. "
                    f"Only 'paid' orders can be shipped."
                ),
            )

        order.status = "shipped"
        await self.db.commit()
        await self.db.refresh(order)

        return self._order_to_response(order)

    async def delete_order(self, order_id: int) -> None:
        """Soft delete an order by setting status to cancelled."""

        result = await self.db.scalars(select(OrderModel).where(OrderModel.id == order_id))
        order = result.first()

        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found",
            )

        order.status = "cancelled"
        await self.db.commit()

    def _order_to_response(self, order: OrderModel) -> OrderResponse:
        items = [
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                price=item.price,
                product=self._product_to_dict(item.product),
            )
            for item in order.items
        ]

        return OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total_amount=order.total_amount,
            created_at=order.created_at,
            items=items,
        )
