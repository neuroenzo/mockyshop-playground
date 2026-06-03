import pytest
from playwright.sync_api import Page


@pytest.fixture
def chromium_page(page: Page) -> Page:
    return page
