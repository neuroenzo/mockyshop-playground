from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user, get_current_seller
from app.db_depends import get_async_db
from app.models.product_image import ProductImageModel
from app.models.users import User as UserModel
from app.schemas import Product as ProductSchema
from app.schemas import ProductCreate, ProductFilter, ProductPaginatedResponse, UploadImageResponse
from app.schemas.product_image import ProductImageResponse
from app.services.product_image import ProductImageService
from app.services.products import ProductService

router = APIRouter(
    prefix="/products",
    tags=["products"],
)


@router.get("/", response_model=ProductPaginatedResponse)
@router.get("", response_model=ProductPaginatedResponse, include_in_schema=False)
async def get_all_products(
    filter: ProductFilter = Depends(),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Returns a paginated, filtered, and sorted list of products.
    """
    service = ProductService(db)

    return await service.get_products(filter)


@router.get("/category/{category_id}", response_model=list[ProductSchema])
async def get_products_by_category(
    category_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Returns a list of active products in the specified category by its ID.
    """
    service = ProductService(db)

    return await service.get_products_by_category(category_id)


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Returns detailed information about a product by its ID.
    """
    service = ProductService(db)

    return await service.get_product(product_id)


@router.post("/", response_model=ProductSchema, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=ProductSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_seller),
):
    """
    Creates a new product.
    """
    service = ProductService(db)

    return await service.create_product(product, current_user.id)


@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: int,
    product: ProductCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_seller),
):
    """
    Updates a product by its ID.
    """
    service = ProductService(db)

    return await service.update_product(product_id, product, current_user.id, current_user.role == "admin")


@router.delete("/{product_id}", response_model=ProductSchema)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_seller),
):
    """
    Deletes a product by its ID (logical delete).
    """
    service = ProductService(db)

    return await service.delete_product(product_id, current_user.id, current_user.role == "admin")


@router.get(
    "/{product_id}/images",
    response_model=list[ProductImageResponse],
)
async def get_product_images(
    product_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    """Get all images for a product."""
    result = await db.scalars(
        select(ProductImageModel).where(ProductImageModel.product_id == product_id).order_by(ProductImageModel.sort_order)
    )
    return list(result.all())


@router.post(
    "/{product_id}/images",
    response_model=UploadImageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_product_images(
    product_id: int,
    files: list[UploadFile] = File(
        ..., description="Product images (max 5, jpg/png/webp, up to 5MB each)"
    ),
    is_main: bool = Query(False, description="Set the first image as the main one"),
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """Upload images for a product. Admin only."""
    service = ProductImageService(db)

    return await service.upload_images(product_id, files, is_main)


@router.delete(
    "/{product_id}/images/{image_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_product_image(
    product_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_seller),
):
    """Delete a product image."""
    service = ProductImageService(db)

    await service.delete_image(product_id, image_id)
