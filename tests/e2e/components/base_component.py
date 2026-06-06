from playwright.sync_api import Page, expect


class BaseComponent:
    def __init__(self, page: Page):
        self.page = page

    def _expect_visible(self, locator, text: str | None = None) -> None:
        expect(locator).to_be_visible()
        if text is not None:
            expect(locator).to_have_text(text)

    def _expect_hidden(self, locator) -> None:
        expect(locator).not_to_be_visible()

    def _expect_enabled(self, locator) -> None:
        expect(locator).to_be_enabled()

    def _click(self, locator) -> None:
        locator.click()

    def _click_and_wait_gone(self, locator) -> None:
        locator.click()
        expect(locator).not_to_be_visible()
