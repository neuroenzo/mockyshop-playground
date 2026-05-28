# Project Summary

## Goal
Build and refactor a FastAPI online store backend with role-based access, order/payment systems, product image uploads, and Ruff linting.

## Constraints & Preferences
- All responses in Russian; code and docstrings in English.
- Plan mode: read-only; build mode: edits allowed; no editing in plan mode.
- Follow fastapi-best-practices (zhanymkanov/fastapi-best-practices).
- Async endpoints only; use `Depends(db_depends.get_async_db)` for DB sessions.
- Business logic in `app/services/`; routers are thin (cart.py pattern).
- C4 model layout: `await file.read()` once, work with bytes.
- Transactional safety: `async with self.db.begin():` for multi-step writes; rollback on partial failures.
- Use `joinedload` for eager loading in responses; use `_product_to_dict` for product dicts.
- Admin-only for image uploads; buyer-only for creating orders and payments.
- Ruff: line-length 100, target py313, lint groups E/F/W/I/UP/B/C4/SIM/PL.

## Done
- Refactored routers (categories, products, admin, users, cart) into thin wrappers with corresponding services in `app/services/`.
- Translated all Russian descriptions/docstrings in `app/schemas.py` (and router descriptions) to English.
- Optimized Pydantic schemas: introduced `CategoryBase`, `ProductBase`, `UserBase`, `CartItemBase` to eliminate field duplication.
- Created order system: model (`OrderModel`, `OrderItemModel`), schemas, `OrderService`, router (`POST/GET /orders/`, `GET /orders/{order_id}`).
- Added role-based order access: buyer sees own, admin sees all, seller sees orders with their products.
- Added `PATCH /orders/{order_id}/status` (admin), `PATCH /orders/{order_id}/ship` (seller), `DELETE /orders/{order_id}` (admin soft delete).
- Created payment/checkout system: model (`PaymentModel`), `PaymentService`, router (`GET /orders/{order_id}/checkout`, `POST /orders/{order_id}/pay`).
- Implemented `CheckoutResponse` with `message` field, `PaymentResponse` with `created_at`.
- Added UUID-based `transaction_id` generation inside service, not in model default.
- Fixed Order-Payment one-to-one relationship (`uselist=False`).
- Created `CartItemSnapshot` pattern to avoid extra DB read after transaction.
- Split monolithic `app/schemas.py` into `app/schemas/__init__.py` + `category.py`, `product.py`, `auth.py`, `user.py`, `cart.py`, `order.py`, `payment.py` — all existing imports preserved.
- Created product image upload system: model (`ProductImageModel` with composite index), schema (`ProductImageResponse`, `UploadImageResponse`), service (`ProductImageService`), endpoint `POST /products/{product_id}/images` (admin only, max 5 files, jpg/png/webp, 5MB each).
- Added `original_filename` field to `ProductImageModel`.
- Added `images` relationship to `Product` model with `cascade="all, delete-orphan"`.
- Added `aiofiles` dependency for async file writes.
- Added `lifespan` to FastAPI app for directory creation; mounted `/static` via `StaticFiles`.
- Implemented partial file cleanup on write failure (try/except with `saved_paths` rollback).
- Added `sort_order` auto-increment based on `MAX(sort_order) + 1`.
- Configured Ruff (0.15.14) in `pyproject.toml`: line-length 100, py313 target, lint groups E/F/W/I/UP/B/C4/SIM/PL, ignores ANN/TRY/EM/ERA/DTZ/B008/pedantic PLR and B904/SIM108/SIM115/SIM117/C408. `per-file-ignores` for migrations (all rules) and models (F821 only).
- Updated `Makefile` with `lint`, `format`, `fix`, `fix-unsafe` targets.
- Added `ruff` to `[project.optional-dependencies] dev`.
- Added `from __future__ import annotations` to all model files for forward reference support.
- **Lint and format now clean**: 0 Ruff errors, 42 files formatted.

## Key Decisions
- Split schemas into `app/schemas/` package for maintainability; all existing `from app.schemas import X` work via `__init__.py` re-exports + `__all__`.
- Order payment is atomic: `async with self.db.begin()` wraps Payment creation + Order status update + cart cleanup.
- Role-based order queries use a subquery (`seller_order_ids`) for seller access to avoid `join()` conflicts with `joinedload()`.
- Product image upload uses in-place bytes for validation (size, type) before writing, with full rollback on failure.
- Ruff configured for medium strictness: excludes overly pedantic rules (ANN, TRY, EM, ERA, DTZ, B008) while catching import sorting, pyupgrade, common bugs, and simplifications.
- `sort_order` computed as `MAX(sort_order) + 1` per product, not a fixed default.
- `upload_dir` creation in `lifespan` (not per-request) for performance and correctness.
- `from __future__ import annotations` in all model files enables clean forward references without quotes; F821 suppressed via `per-file-ignores`.

## Next Steps
1. Consider adding `PATCH /products/{product_id}/images/{image_id}` endpoints for updating `is_main` or `sort_order`.
2. Consider adding a `GET /products/{product_id}/images` endpoint to list images for a product.
3. (Optional) Add thumbnail/resize support on upload.

## Critical Context
- Python 3.13+, asyncpg PostgreSQL on localhost:5434, SQLAlchemy 2.0 async.
- Alembic migrations applied: initial (empty), `add orders table` (`f31e2fcc770f`), `add payments table` (`9c61af8e3fa1`), `add product_images table` (latest).
- Database `ecommerce.db` is SQLite; migrations target PostgreSQL via `DATABASE_URL` in `app/database.py`.
- Ruff 0.15.14 installed; commands: `uv run ruff check .` (lint), `uv run ruff format .` (format), `uv run ruff check --fix .` (auto-fix), `uv run ruff check --fix --unsafe-fixes .` (unsafe fixes).
- Existing Alembic env.py imports `from app import models` — all new models are registered in `app/models/__init__.py`.
- `DEV` dependencies declared in `[project.optional-dependencies] dev`; install with `uv sync` or `uv add --dev`.

## Relevant Files
- `app/models/`: `product_image.py` (new), `order.py`, `payment.py`, `products.py` (+ `images` rel), `cart.py`, `categories.py`, `users.py`, `__init__.py` (all models registered).
- `app/services/`: `product_image.py` (new), `payment.py`, `order.py`, `cart.py`, `categories.py`, `products.py`, `admin.py`, `users.py`.
- `app/routers/`: `products.py` (+ `POST /{id}/images`), `order.py` (+ status/ship/delete), `payment.py` (checkout/pay), `cart.py`, `categories.py`, `admin.py`, `users.py`.
- `app/schemas/`: 9 files (`__init__.py`, `category.py`, `product.py`, `auth.py`, `user.py`, `cart.py`, `order.py`, `payment.py`, `product_image.py`).
- `app/main.py`: FastAPI app with `lifespan` + `StaticFiles` mount + all routers.
- `app/auth.py`: `get_current_admin_user`, `get_current_seller`, `get_current_buyer`, `get_current_user`, `get_current_user_id` — used for role checks.
- `app/db_depends.py`: `get_async_db` — async session generator.
- `pyproject.toml`: Ruff config + dependencies.
- `Makefile`: `dev`, `lint`, `format`, `check`, `fix`, `fix-unsafe` targets.
- `AGENTS.md`: This file — comprehensive session summary.
- `static/uploads/products/`: upload directory for product images (`.gitkeep` present).
