from typing import Generator

import pytest

from playwright.sync_api import Browser, Page

from pages.main_page import MainPage
from support.api.auth_access import ApiAuthAccess
from support.services.authentication import create_authenticated_page
from tests.config import AuthConfig


@pytest.fixture
def user_role_factory(env_config):
    """Factory fixture — returns callable(role) -> dict с credentials."""
    roles = {
        "admin":  {
            "email": env_config.admin_email,
            "password": env_config.admin_password.get_secret_value()
        },
        "buyer":  {
            "email": env_config.buyer_email,
            "password": env_config.buyer_password.get_secret_value()
        },
        "seller": {
            "email": env_config.seller_email,
            "password": env_config.seller_password.get_secret_value()
        },
    }
    def _user_role(role: str) -> dict:
        if role not in roles:
            raise ValueError(f"Unknown role: {role}")
        return roles[role]
    return _user_role


@pytest.fixture
def get_admin(
    browser: Browser,
    env_config: AuthConfig,
    admin_token: str,
) -> Generator[Page, None, None]:
    context, page = create_authenticated_page(
        browser,
        env_config.url_schema,
        env_config.shop_url,
        admin_token,
    )
    yield page
    context.close()


@pytest.fixture(scope="session")
def admin_token(api_auth: ApiAuthAccess, env_config: AuthConfig) -> str:
    return api_auth.login(
        env_config.admin_email,
        env_config.admin_password.get_secret_value()
    )


@pytest.fixture
def admin(get_admin: Page) -> MainPage:
    return MainPage(page=get_admin)


@pytest.fixture
def get_buyer(
    browser: Browser,
    env_config: AuthConfig,
    buyer_token: str,
) -> Generator[Page, None, None]:
    context, page = create_authenticated_page(
        browser,
        env_config.url_schema,
        env_config.shop_url,
        buyer_token,
    )
    yield page
    context.close()


@pytest.fixture(scope="session")
def buyer_token(api_auth: ApiAuthAccess, env_config: AuthConfig) -> str:
    return api_auth.login(
        env_config.buyer_email,
        env_config.buyer_password.get_secret_value()
    )


@pytest.fixture
def buyer(get_buyer: Page) -> MainPage:
    return MainPage(page=get_buyer)


@pytest.fixture
def get_seller(
    browser: Browser,
    env_config: AuthConfig,
    seller_token: str,
) -> Generator[Page, None, None]:
    context, page = create_authenticated_page(
        browser,
        env_config.url_schema,
        env_config.shop_url,
        seller_token,
    )
    yield page
    context.close()


@pytest.fixture(scope="session")
def seller_token(api_auth: ApiAuthAccess, env_config: AuthConfig) -> str:
    return api_auth.login(
        env_config.seller_email,
        env_config.seller_password.get_secret_value()
    )


@pytest.fixture
def seller(get_seller: Page) -> MainPage:
    return MainPage(page=get_seller)
