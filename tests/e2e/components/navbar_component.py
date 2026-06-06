from playwright.sync_api import Page

from components.base_component import BaseComponent



class NavbarComponent(BaseComponent):
    def __init__(self, page: Page):
        super().__init__(page)

        self.app_title = page.get_by_test_id('nav-home')
        self.user_email_link = page.get_by_test_id('nav-profile')
        self.logout_button = page.get_by_test_id('btn-logout')

    def check_visible(self) -> None:
        self._expect_visible(self.app_title, 'MockyShop')

    def should_have_email(self, expected_email: str) -> None:
        self._expect_visible(self.user_email_link, expected_email)

    def should_be_logged_in(self) -> None:
        self._expect_enabled(self.logout_button)

    def click_logout(self) -> None:
        self._click_and_wait_gone(self.logout_button)
