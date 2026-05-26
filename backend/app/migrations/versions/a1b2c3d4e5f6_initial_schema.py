"""initial_schema

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-05-25 15:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_foreign_key(
        "fk_categories_parent",
        "categories",
        "categories",
        ["parent_id"],
        ["id"],
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("image_url", sa.String(length=200), nullable=True),
        sa.Column("stock", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("seller_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_foreign_key(
        "fk_products_category",
        "products",
        "categories",
        ["category_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_products_seller",
        "products",
        "users",
        ["seller_id"],
        ["id"],
    )

    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_foreign_key(
        "fk_carts_user",
        "carts",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_table(
        "orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_foreign_key(
        "fk_orders_user",
        "orders",
        "users",
        ["user_id"],
        ["id"],
    )

    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("cart_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cart_items_cart_id", "cart_items", ["cart_id"])
    op.create_index("ix_cart_items_product_id", "cart_items", ["product_id"])
    op.create_foreign_key(
        "fk_cart_items_cart",
        "cart_items",
        "carts",
        ["cart_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_cart_items_product",
        "cart_items",
        "products",
        ["product_id"],
        ["id"],
    )

    op.create_table(
        "order_items",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_foreign_key(
        "fk_order_items_order",
        "order_items",
        "orders",
        ["order_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_order_items_product",
        "order_items",
        "products",
        ["product_id"],
        ["id"],
    )

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("order_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("payment_method", sa.String(length=20), nullable=False),
        sa.Column("transaction_id", sa.String(length=36), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("transaction_id"),
    )
    op.create_index("ix_payments_order_id", "payments", ["order_id"], unique=True)
    op.create_foreign_key(
        "fk_payments_order",
        "payments",
        "orders",
        ["order_id"],
        ["id"],
    )

    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("product_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=True),
        sa.Column("is_main", sa.Boolean(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_product_images_product_id", "product_images", ["product_id"])
    op.create_index(
        "ix_product_images_product_sort",
        "product_images",
        ["product_id", "sort_order"],
    )
    op.create_foreign_key(
        "fk_product_images_product",
        "product_images",
        "products",
        ["product_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_table("product_images")
    op.drop_table("payments")
    op.drop_table("order_items")
    op.drop_table("cart_items")
    op.drop_table("orders")
    op.drop_table("carts")
    op.drop_table("products")
    op.drop_table("users")
    op.drop_table("categories")
