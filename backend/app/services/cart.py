from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.cart import CartItemModel, CartModel
from app.models.products import Product as ProductModel
from app.schemas import CartItemResponse, CartResponse


class CartService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_or_create_cart(self, user_id: int) -> CartModel:
        result = await self.db.scalars(select(CartModel).where(CartModel.user_id == user_id))
        cart = result.first()
        if not cart:
            cart = CartModel(user_id=user_id)
            self.db.add(cart)
            await self.db.commit()
            await self.db.refresh(cart)

        return cart

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

    async def get_cart(self, user_id: int) -> CartResponse:
        cart = await self._get_or_create_cart(user_id)
        result = await self.db.scalars(
            select(CartModel)
            .options(joinedload(CartModel.items).joinedload(CartItemModel.product))
            .where(CartModel.id == cart.id)
        )
        cart = result.unique().first()

        if not cart:
            return CartResponse(id=0, items=[], total_amount=Decimal("0.00"), total_items=0)

        items = [
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                product=self._product_to_dict(item.product),
            )
            for item in cart.items
        ]

        total_amount = sum(
            (item.product.price * item.quantity for item in cart.items),
            Decimal("0.00"),
        )
        total_items = sum(item.quantity for item in cart.items)

        return CartResponse(
            id=cart.id,
            items=items,
            total_amount=total_amount,
            total_items=total_items,
        )

    async def add_item(self, user_id: int, product_id: int, quantity: int) -> CartItemResponse:
        product = await self.db.scalar(
            select(ProductModel).where(
                ProductModel.id == product_id,
                ProductModel.is_active,
            )
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or inactive",
            )

        if quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Not enough stock. Available: {product.stock}, requested: {quantity}"),
            )

        cart = await self._get_or_create_cart(user_id)

        existing = await self.db.scalar(
            select(CartItemModel).where(
                CartItemModel.cart_id == cart.id,
                CartItemModel.product_id == product_id,
            )
        )

        if existing:
            new_quantity = existing.quantity + quantity
            if new_quantity > product.stock:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Not enough stock. You already have "
                        f"{existing.quantity} in cart. "
                        f"Available: {product.stock}"
                    ),
                )
            existing.quantity = new_quantity
            await self.db.commit()
            await self.db.refresh(existing)

            return CartItemResponse(
                id=existing.id,
                product_id=existing.product_id,
                quantity=existing.quantity,
                product=self._product_to_dict(product),
            )

        cart_item = CartItemModel(
            cart_id=cart.id,
            product_id=product_id,
            quantity=quantity,
        )
        self.db.add(cart_item)
        await self.db.commit()
        await self.db.refresh(cart_item)

        return CartItemResponse(
            id=cart_item.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            product=self._product_to_dict(product),
        )

    async def update_item_quantity(
        self, user_id: int, item_id: int, quantity: int
    ) -> CartItemResponse:
        cart = await self._get_or_create_cart(user_id)

        result = await self.db.scalars(
            select(CartItemModel)
            .options(joinedload(CartItemModel.product))
            .where(
                CartItemModel.id == item_id,
                CartItemModel.cart_id == cart.id,
            )
        )
        item = result.unique().first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        if quantity > item.product.stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Not enough stock. Available: {item.product.stock}"),
            )

        item.quantity = quantity
        await self.db.commit()
        await self.db.refresh(item)

        return CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            product=self._product_to_dict(item.product),
        )

    async def remove_item(self, user_id: int, item_id: int) -> None:
        cart = await self._get_or_create_cart(user_id)

        result = await self.db.scalars(
            select(CartItemModel).where(
                CartItemModel.id == item_id,
                CartItemModel.cart_id == cart.id,
            )
        )
        item = result.first()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cart item not found",
            )

        await self.db.delete(item)
        await self.db.commit()

    async def clear_cart(self, user_id: int) -> None:
        cart = await self._get_or_create_cart(user_id)

        await self.db.execute(delete(CartItemModel).where(CartItemModel.cart_id == cart.id))
        await self.db.commit()
