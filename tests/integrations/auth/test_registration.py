import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

REGISTER_URL = "/users/"


class TestRegistration:
    async def test_register_buyer_success(self, async_client: AsyncClient):
        payload = {"email": "buyer@test.com", "password": "TestPass123", "role": "buyer"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "buyer@test.com"
        assert data["role"] == "buyer"
        assert data["is_active"] is True
        assert "id" in data

    async def test_register_seller_success(self, async_client: AsyncClient):
        payload = {"email": "seller@test.com", "password": "TestPass123", "role": "seller"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 201
        assert response.json()["role"] == "seller"

    async def test_register_duplicate_email(self, async_client: AsyncClient):
        payload = {"email": "dup@test.com", "password": "TestPass123", "role": "buyer"}
        await async_client.post(REGISTER_URL, json=payload)
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 409
        assert "already" in response.json()["detail"].lower()

    async def test_register_short_password(self, async_client: AsyncClient):
        payload = {"email": "short@test.com", "password": "123", "role": "buyer"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 422

    async def test_register_invalid_email(self, async_client: AsyncClient):
        payload = {"email": "not-an-email", "password": "TestPass123", "role": "buyer"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 422

    async def test_register_invalid_role(self, async_client: AsyncClient):
        payload = {"email": "badrole@test.com", "password": "TestPass123", "role": "superadmin"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 422

    async def test_register_default_role(self, async_client: AsyncClient):
        payload = {"email": "default@test.com", "password": "TestPass123"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 201
        assert response.json()["role"] == "buyer"

    async def test_register_password_not_returned(self, async_client: AsyncClient):
        payload = {"email": "secure@test.com", "password": "TestPass123", "role": "buyer"}
        response = await async_client.post(REGISTER_URL, json=payload)
        assert response.status_code == 201
        assert "password" not in response.json()
