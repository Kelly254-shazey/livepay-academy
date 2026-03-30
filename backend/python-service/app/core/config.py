from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    environment: str = "development"
    service_name: str = "livegate-python-service"
    port: int = 8000
    database_url: str = "mysql+aiomysql://livegate:livegate@mysql:3306/livegate_python"
    source_database_url: str = "mysql+aiomysql://livegate:livegate@mysql:3306/livegate_nodejs"
    database_ssl_enabled: bool = False
    database_ssl_verify: bool = True
    database_ssl_ca_path: str | None = None
    source_database_ssl_enabled: bool = False
    source_database_ssl_verify: bool = True
    source_database_ssl_ca_path: str | None = None
    redis_url: str | None = None
    internal_api_key: str = ""  # Must be set via environment variable
    cache_ttl_seconds: int = 300
    log_level: str = "INFO"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.internal_api_key:
            raise ValueError(
                "INTERNAL_API_KEY environment variable must be set. "
                "Do not use hardcoded values in production."
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
