import pytest
from httpx import AsyncClient

from app.auth import create_access_token
from factories.user_factory import UserFactory

pytestmark = pytest.mark.asyncio


class TestAuthorization:
    async def test_public_endpoint_no_auth(self, async_client: AsyncClient):
        response = await async_client.get("/")
        assert response.status_code == 200
        assert response.json()["message"] == "Welcome to the MockyShop API!"

    async def test_protected_endpoint_no_auth(self, async_client: AsyncClient):
        response = await async_client.get("/users/current_user")
        assert response.status_code == 401

    @pytest.mark.parametrize(
        "role,expected_status",
        [
            ("admin", 200),
            ("seller", 403),
            ("buyer", 403),
        ],
    )
    async def test_admin_list_users(
        self, async_client: AsyncClient, db_session, role, expected_status
    ):
        user = await UserFactory.create(db_session, role=role)
        token = create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        response = await async_client.get(
            "/users/",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == expected_status

    @pytest.mark.parametrize(
        "role,expected_status",
        [
            ("admin", 201),
            ("seller", 403),
            ("buyer", 403),
        ],
    )
    async def test_admin_create_user(
        self, async_client: AsyncClient, db_session, role, expected_status
    ):
        user = await UserFactory.create(db_session, role=role)
        token = create_access_token(
            data={"sub": user.email, "role": user.role, "id": user.id}
        )
        payload = {"email": "newuser@test.com", "password": "TestPass123", "role": "buyer"}
        response = await async_client.post(
            "/admin/users/",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == expected_status

    @pytest.mark.parametrize(
        "role,expected_status",
        [
            ("admin", 200),
            ("seller", 403),
            ("buyer", 403),
        ],
    )
    async def test_admin_update_role(
        self, async_client: AsyncClient, db_session, role, expected_status
    ):
        admin = await UserFactory.create(db_session, role="admin")
        admin_token = create_access_token(
            data={"sub": admin.email, "role": admin.role, "id": admin.id}
        )
        target = await UserFactory.create(db_session, role="buyer")

        actor = await UserFactory.create(db_session, role=role)
        actor_token = create_access_token(
            data={"sub": actor.email, "role": actor.role, "id": actor.id}
        )

        response = await async_client.patch(
            f"/users/{target.id}/role",
            json={"role": "seller"},
            headers={"Authorization": f"Bearer {actor_token}"},
        )
        assert response.status_code == expected_status

    @pytest.mark.parametrize(
        "endpoint,method,payload",
        [
            ("/users/", "get", None),
            ("/users/current_user", "get", None),
            ("/admin/users/", "post", {"email": "u@t.com", "password": "TestPass123", "role": "buyer"}),
            ("/users/token", "post", None),
        ],
    )
    async def test_anonymous_access(
        self, async_client: AsyncClient, endpoint, method, payload
    ):
        if method == "get":
            response = await async_client.get(endpoint)
        else:
            response = await async_client.post(endpoint, json=payload)

        if endpoint == "/":
            assert response.status_code == 200
        elif endpoint == "/users/token":
            assert response.status_code == 422
        elif endpoint == "/users/current_user":
            assert response.status_code == 401
        else:
            assert response.status_code in (401, 403)
