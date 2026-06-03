import pytest
from pages.login_page import LoginPage
from pages.main_page import MainPage
from tests.config import AuthConfig


class TestAuthorization:
    @pytest.mark.e2e
    @pytest.mark.authorization
    @pytest.mark.parametrize(
        'role_name',
        ['admin', 'buyer', 'seller'],
    )
    def test_login_different_roles(
            self,
            login_page: LoginPage,
            main_page: MainPage,
            user_role,
            role_name: str,
            env_config: AuthConfig
    ) -> None:
        creds = user_role(role_name)
        login_page.open(f'{env_config.host}:{env_config.port}')
        login_page.check_welcome_title()
        login_page.fill_login_form(email=creds['email'], password=creds['password'])
        login_page.click_login_button()
        main_page.should_be_logged_in()
        main_page.should_have_user_email(creds['email'])
