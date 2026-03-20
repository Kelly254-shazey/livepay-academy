from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    environment: str = "development"
    service_name: str = "livegate-python-service"
    port: int = 8000
    database_url: str = "mysql+aiomysql://livegate:livegate@mysql:3306/livegate_python"
    source_database_url: str = "mysql+aiomysql://livegate:livegate@mysql:3306/livegate_nodejs"
    redis_url: str = "redis://redis:6379/0"
    internal_api_key: str = "livegate-internal-key"
    cache_ttl_seconds: int = 300


@lru_cache
def get_settings() -> Settings:
    return Settings()

