from datetime import UTC, datetime, timedelta

import jwt
import pytest
from httpx import AsyncClient

from app.auth import create_access_token
from app.config import ALGORITHM, SECRET_KEY
from factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio

LOGIN_URL = "/users/token"


class TestAuthentication:
    async def test_login_success(self, async_client: AsyncClient, db_session):
        await UserFactory.create(db_session, email="login@test.com", raw_password="TestPass123")
        response = await async_client.post(
            LOGIN_URL,
            data={"username": "login@test.com", "password": "TestPass123"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_wrong_password(self, async_client: AsyncClient, db_session):
        await UserFactory.create(db_session, email="wrong@test.com", raw_password="TestPass123")
        response = await async_client.post(
            LOGIN_URL,
            data={"username": "wrong@test.com", "password": "WrongPass"},
        )
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, async_client: AsyncClient):
        response = await async_client.post(
            LOGIN_URL,
            data={"username": "nobody@test.com", "password": "TestPass123"},
        )
        assert response.status_code == 401

    async def test_login_inactive_user(self, async_client: AsyncClient, db_session):
        await UserFactory.create(
            db_session, email="inactive@test.com", raw_password="TestPass123", is_active=False
        )
        response = await async_client.post(
            LOGIN_URL,
            data={"username": "inactive@test.com", "password": "TestPass123"},
        )
        assert response.status_code == 401

    async def test_token_valid(self, async_client: AsyncClient, db_session):
        user = await UserFactory.create(db_session, email="valid@test.com", raw_password="TestPass123")
        token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
        response = await async_client.get(
            "/users/current_user",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        assert response.json()["email"] == "valid@test.com"

    async def test_token_expired(self, async_client: AsyncClient):
        expired = datetime.now(UTC) - timedelta(hours=1)
        token = jwt.encode(
            {"sub": "x@y.com", "role": "buyer", "id": 1, "exp": expired},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        response = await async_client.get(
            "/users/current_user",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 401

    async def test_token_malformed(self, async_client: AsyncClient):
        response = await async_client.get(
            "/users/current_user",
            headers={"Authorization": "Bearer not-a-valid-jwt"},
        )
        assert response.status_code == 401

    async def test_missing_auth_header(self, async_client: AsyncClient):
        response = await async_client.get("/users/current_user")
        assert response.status_code == 401
