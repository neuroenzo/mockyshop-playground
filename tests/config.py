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
    shop_url: str
    host: str = "localhost"
    port: int = 3003

    model_config = SettingsConfigDict(env_file=Path(__file__).parent / ".env")
