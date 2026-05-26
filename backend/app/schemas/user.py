from enum import StrEnum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, SecretStr


class UserBase(BaseModel):
    email: EmailStr = Field(description="User email")


class UserCreate(UserBase):
    password: SecretStr = Field(min_length=8, description="Password (minimum 8 characters)")
    role: str = Field(
        default="buyer",
        pattern="^(buyer|seller)$",
        description="Role: 'buyer' or 'seller'",
    )


class UserAdminCreate(UserBase):
    password: SecretStr = Field(min_length=8, description="Password (minimum 8 characters)")
    role: str = Field(
        default="buyer",
        pattern="^(buyer|seller|admin)$",
        description="Role: 'buyer', 'seller', or 'admin'",
    )


class User(UserBase):
    id: int
    is_active: bool
    role: str

    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdate(BaseModel):
    role: str = Field(
        ...,
        pattern="^(buyer|seller|admin)$",
        description="New user role: 'buyer', 'seller', or 'admin'",
    )


class UserSortBy(StrEnum):
    EMAIL = "email"
    ROLE = "role"
    ID_ASC = "id_asc"
    ID_DESC = "id_desc"


class UserFilter(BaseModel):
    search: str | None = None
    role: str | None = None
    is_active: bool | None = None
    sort_by: UserSortBy = UserSortBy.ID_DESC
    page: int = Field(1, ge=1)
    size: int = Field(20, ge=1, le=100)


class UserPaginatedResponse(BaseModel):
    items: list[User]
    total: int
    page: int
    size: int
    pages: int
