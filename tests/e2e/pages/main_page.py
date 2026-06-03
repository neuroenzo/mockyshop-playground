from components.navbar_component import NavbarComponent
from pages.base_page import BasePage
from playwright.sync_api import Page


class MainPage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

        self.navbar = NavbarComponent(page)
        self.home_page_hero = page.get_by_test_id('home-page')

    def should_have_user_email(self, expected_email: str) -> None:
        self.navbar.should_have_email(expected_email)

    def should_be_logged_in(self) -> None:
        self.navbar.should_be_logged_in()

    def click_logout(self) -> None:
        self.navbar.click_logout()
