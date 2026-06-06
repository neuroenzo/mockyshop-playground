import pytest

from playwright.sync_api import Page

from pages.login_page import LoginPage
from pages.main_page import MainPage



@pytest.fixture
def ui_login_page(page: Page) -> LoginPage:
    return LoginPage(page=page)


@pytest.fixture
def ui_main_page(page: Page) -> MainPage:
    return MainPage(page=page)


@pytest.fixture
def admin(get_admin: Page) -> MainPage:
    return MainPage(page=get_admin)


@pytest.fixture
def buyer(get_buyer: Page) -> MainPage:
    return MainPage(page=get_buyer)


@pytest.fixture
def seller(get_seller: Page) -> MainPage:
    return MainPage(page=get_seller)
