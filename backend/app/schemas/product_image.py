from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductImageResponse(BaseModel):
    id: int
    product_id: int
    image_url: str
    original_filename: str | None
    is_main: bool
    sort_order: int
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UploadImageResponse(BaseModel):
    images: list[ProductImageResponse]
