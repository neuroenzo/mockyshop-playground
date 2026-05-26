import uuid
from pathlib import Path

import aiofiles
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product_image import ProductImageModel
from app.models.products import Product as ProductModel
from app.schemas.product_image import ProductImageResponse, UploadImageResponse

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024
MAX_FILES = 5
UPLOAD_DIR = Path("static/uploads/products")


class ProductImageService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upload_images(
        self, product_id: int, files: list[UploadFile], is_main: bool = False
    ) -> UploadImageResponse:

        product = await self.db.scalar(
            select(ProductModel).where(
                ProductModel.id == product_id,
                ProductModel.is_active,
            )
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {product_id} not found or inactive",
            )

        if len(files) > MAX_FILES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {MAX_FILES} files per request (got {len(files)})",
            )

        if not files:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No files provided",
            )

        validated_files: list[tuple[str, str, bytes]] = []
        for file in files:
            ext = self._validate_extension(file.filename)
            content = await file.read()
            self._validate_size(file.filename, content)
            validated_files.append((file.filename, ext, content))

        saved_paths: list[Path] = []
        try:
            for _original_name, ext, content in validated_files:
                filename = f"{uuid.uuid4()}{ext}"
                file_path = UPLOAD_DIR / filename
                async with aiofiles.open(file_path, "wb") as f:
                    await f.write(content)
                saved_paths.append(file_path)
        except Exception:
            for p in saved_paths:
                p.unlink(missing_ok=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="File upload failed, all changes reverted",
            )

        if is_main:
            await self.db.execute(
                update(ProductImageModel)
                .where(
                    ProductImageModel.product_id == product_id,
                    ProductImageModel.is_main,
                )
                .values(is_main=False)
            )

        max_sort = await self.db.scalar(
            select(func.max(ProductImageModel.sort_order)).where(
                ProductImageModel.product_id == product_id
            )
        )
        next_sort = (max_sort or 0) + 1

        db_records = [
            ProductImageModel(
                product_id=product_id,
                image_url=f"/static/uploads/products/{saved_paths[i].name}",
                original_filename=validated_files[i][0],
                is_main=(is_main and i == 0),
                sort_order=next_sort + i,
            )
            for i in range(len(validated_files))
        ]

        self.db.add_all(db_records)
        await self.db.commit()
        for record in db_records:
            await self.db.refresh(record)

        return UploadImageResponse(
            images=[ProductImageResponse.model_validate(r) for r in db_records]
        )

    async def delete_image(self, product_id: int, image_id: int) -> None:
        image = await self.db.scalar(
            select(ProductImageModel).where(
                ProductImageModel.id == image_id,
                ProductImageModel.product_id == product_id,
            )
        )
        if not image:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found",
            )

        filename = Path(image.image_url).name
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            file_path.unlink()

        await self.db.delete(image)
        await self.db.commit()

    @staticmethod
    def _validate_extension(filename: str | None) -> str:
        if not filename or ".." in filename or "/" in filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file name",
            )
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"),
            )

        return ext

    @staticmethod
    def _validate_size(filename: str, content: bytes) -> None:
        if len(content) > MAX_FILE_SIZE:
            size_kb = len(content) // 1024
            max_mb = MAX_FILE_SIZE // 1024 // 1024
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(f"File '{filename}' too large ({size_kb} KB). Maximum: {max_mb} MB"),
            )
