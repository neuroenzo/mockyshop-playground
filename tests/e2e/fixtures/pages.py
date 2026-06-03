import pytest
from pages.login_page import LoginPage
from pages.main_page import MainPage
from playwright.sync_api import Page


@pytest.fixture
def login_page(chromium_page: Page) -> LoginPage:
    return LoginPage(page=chromium_page)


@pytest.fixture
def main_page(chromium_page: Page) -> MainPage:
    return MainPage(page=chromium_page)

@pytest.fixture
def user_role(env_config):
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
