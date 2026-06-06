import re

from playwright.sync_api import Page, expect

from pages.base_page import BasePage



class LoginPage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

        self.email_input = page.get_by_test_id('input-email')
        self.password_input = page.get_by_test_id('input-password')
        self.login_button = page.get_by_test_id('btn-login-submit')
        self.welcome_title = page.get_by_test_id('welcome-title')

    def check_welcome_title(self):
        expect(self.welcome_title).to_be_visible()
        expect(self.welcome_title).to_have_text('Welcome to MockyShop')

    def fill_login_form(self, email: str, password: str):
        self.email_input.fill(email)
        expect(self.email_input).to_have_value(email)
        self.password_input.fill(password)
        expect(self.password_input).to_have_value(password)

    def click_login_button(self):
        self.login_button.click()
        expect(self.page).to_have_url(re.compile(r"/$"))
