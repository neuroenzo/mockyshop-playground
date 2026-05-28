import pytest_asyncio

from app.auth import create_access_token
from factories.user_factory import UserFactory


@pytest_asyncio.fixture
async def buyer_user(db_session):
    return await UserFactory.create(db_session, role="buyer")


@pytest_asyncio.fixture
async def seller_user(db_session):
    return await UserFactory.create(db_session, role="seller")


@pytest_asyncio.fixture
async def admin_user(db_session):
    return await UserFactory.create(db_session, role="admin")


@pytest_asyncio.fixture
async def buyer_token(buyer_user):
    return create_access_token(
        data={"sub": buyer_user.email, "role": buyer_user.role, "id": buyer_user.id}
    )


@pytest_asyncio.fixture
async def seller_token(seller_user):
    return create_access_token(
        data={"sub": seller_user.email, "role": seller_user.role, "id": seller_user.id}
    )


@pytest_asyncio.fixture
async def admin_token(admin_user):
    return create_access_token(
        data={"sub": admin_user.email, "role": admin_user.role, "id": admin_user.id}
    )
