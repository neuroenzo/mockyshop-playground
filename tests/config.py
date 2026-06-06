from pathlib import Path

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class AuthConfig(BaseSettings):
    admin_email: str
    admin_password: SecretStr
    buyer_email: str
    buyer_password: SecretStr
    seller_email: str
    seller_password: SecretStr
    shop_url: str = "localhost:3003"
    api_url: str = "localhost:8000"
    url_schema: str = 'http'

    model_config = SettingsConfigDict(env_file=Path(__file__).parent / ".env")
