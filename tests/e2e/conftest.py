import pytest
from tests.config import AuthConfig

pytest_plugins = (
    "fixtures.browser",
    "fixtures.pages",
)

@pytest.fixture(scope="session")
def env_config() -> AuthConfig:
    return AuthConfig()
