from pydantic import BaseModel, ConfigDict, Field


class CategoryBase(BaseModel):
    name: str = Field(
        ..., min_length=3, max_length=50, description="Category name (3-50 characters)"
    )
    parent_id: int | None = Field(None, description="Parent category ID, if any")


class CategoryCreate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int = Field(..., description="Unique category identifier")
    is_active: bool = Field(..., description="Category activity status")

    model_config = ConfigDict(from_attributes=True)
