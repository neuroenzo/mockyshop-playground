from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Computed,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    __table_args__ = (Index("idx_products_ts_vector", "ts_vector", postgresql_using="gin"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(200), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    ts_vector: Mapped[TSVECTOR | None] = mapped_column(
        TSVECTOR,
        Computed(
            "to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))",
            persisted=True,
        ),
        nullable=True,
    )
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False)
    seller_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    category: Mapped[Category] = relationship("Category", back_populates="products")
    seller: Mapped[User] = relationship("User", back_populates="products")
    images: Mapped[list[ProductImageModel]] = relationship(
        "ProductImageModel", back_populates="product", cascade="all, delete-orphan"
    )
