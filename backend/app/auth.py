from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import ALGORITHM, SECRET_KEY
from app.db_depends import get_async_db
from app.models.users import User as UserModel

"""
from argon2 import PasswordHasher, Type

# Argon2 контекст (bcrypt как fallback)
pwd_context = PasswordHasher(
    time_cost=2,           # Iterations (1-3 для API)
    memory_cost=19456,     # 19MB (OWASP 2026 interactive)
    parallelism=4,         # CPU cores
    hash_len=32,
    salt_len=16,
    type=Type.ARGON2_ID    # Hybrid (рекомендуется)
)
"""

# Создаём контекст для хеширования с использованием bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/token")


def hash_password(password: str) -> str:
    """
    Преобразует пароль в хеш с использованием bcrypt.
    """

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет, соответствует ли введённый пароль сохранённому хешу.
    """

    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    """
    Создаёт JWT с payload (sub, role, id, exp).
    """
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_db)
):
    """
    Проверяет JWT и возвращает пользователя из базы.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise credentials_exception
    result = await db.scalars(
        select(UserModel).where(UserModel.email == email, UserModel.is_active)
    )
    user = result.first()
    if user is None:
        raise credentials_exception

    return user


async def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int | None = payload.get("id")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    return user_id


async def get_current_seller(current_user: UserModel = Depends(get_current_user)):
    """
    Проверяет, что пользователь имеет роль 'seller' или 'admin'.
    """
    if current_user.role not in ("seller", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers or admins can perform this action",
        )

    return current_user


async def get_current_admin_user(current_user: UserModel = Depends(get_current_user)):
    """
    Проверяет, что пользователь имеет роль 'admin'.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Действие доступно только администратору",
        )

    return current_user


async def get_current_buyer(current_user: UserModel = Depends(get_current_user)):
    """
    Проверяет, что пользователь имеет роль 'buyer'.
    """
    if current_user.role != "buyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only buyers can perform this action",
        )

    return current_user
