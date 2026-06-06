import pytest

from pages.login_page import LoginPage
from pages.main_page import MainPage
from tests.config import AuthConfig


@pytest.mark.e2e
@pytest.mark.authorization
class TestLogIn:
    @pytest.mark.parametrize(
        'role_name',
        ['admin', 'buyer', 'seller'],
    )
    def test_login_different_roles(
            self,
            ui_login_page: LoginPage,
            ui_main_page: MainPage,
            user_role_factory,
            role_name: str,
            env_config: AuthConfig
    ) -> None:
        creds = user_role_factory(role_name)
        ui_login_page.open(f'{env_config.url_schema}{env_config.shop_url}')
        ui_login_page.check_welcome_title()
        ui_login_page.fill_login_form(email=creds['email'], password=creds['password'])
        ui_login_page.click_login_button()
        ui_main_page.should_be_logged_in()
        ui_main_page.should_have_user_email(creds['email'])
