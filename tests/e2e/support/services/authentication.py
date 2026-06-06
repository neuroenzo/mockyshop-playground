from json import dumps

from playwright.sync_api import Browser, BrowserContext, Page


def create_authenticated_page(
    browser: Browser,
    url_schema: str,
    shop_url: str,
    token: str,
) -> tuple[BrowserContext, Page]:
    context = browser.new_context()
    context.add_init_script(
        f"localStorage.setItem('auth_token', {dumps(token)})",
    )
    page = context.new_page()
    page.goto(f"{url_schema}{shop_url}", wait_until="networkidle")
    return context, page
