import pytest

from support.api.auth_access import ApiAuthAccess
from tests.config import AuthConfig

pytest_plugins = (
    "fixtures.pages",
    "fixtures.users",
)


@pytest.fixture(scope="session")
def env_config() -> AuthConfig:
    return AuthConfig()


@pytest.fixture(scope="session")
def api_auth(env_config: AuthConfig) -> ApiAuthAccess:
    return ApiAuthAccess(
        api_url=f"{env_config.url_schema}{env_config.api_url}"
    )
