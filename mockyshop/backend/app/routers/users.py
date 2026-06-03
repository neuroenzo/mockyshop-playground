from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_admin_user, get_current_user
from app.db_depends import get_async_db
from app.models.users import User as UserModel
from app.schemas import User as UserSchema
from app.schemas import UserCreate, UserFilter, UserPaginatedResponse, UserRoleUpdate, UserUpdate
from app.services.users import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
@router.post(
    "", response_model=UserSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False
)
async def create_user(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_db),
):
    """
    Creates a new user
    """
    service = UserService(db)

    return await service.create_user(user)


@router.get("/", response_model=UserPaginatedResponse)
@router.get("", response_model=UserPaginatedResponse, include_in_schema=False)
async def get_all_users(
    filter: UserFilter = Depends(),
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Returns a paginated, filtered list of users. Admin only.
    """
    service = UserService(db)

    return await service.get_all_users(filter)


@router.get("/current_user", response_model=UserSchema)
async def get_current_user_profile(
    db: AsyncSession = Depends(get_async_db),
    current_user: UserModel = Depends(get_current_user),
):
    """
    Returns the current authenticated user's profile. Accessible by all roles.
    """

    return current_user


@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_async_db),
):
    """
    Authenticate user with email and password, returns a JWT access token.
    """
    service = UserService(db)

    return await service.login(form_data)


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Updates user email and/or password. Admin only.
    """
    service = UserService(db)

    return await service.update_user(user_id, data)


@router.patch("/{user_id}/role", response_model=UserSchema)
async def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: AsyncSession = Depends(get_async_db),
    admin: UserModel = Depends(get_current_admin_user),
):
    """
    Changes a user's role. Admin only.
    """
    service = UserService(db)

    return await service.update_user_role(user_id, role_data)
