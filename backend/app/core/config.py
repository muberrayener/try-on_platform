from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    env: str = "development"
    mongodb_url: str
    mongodb_db: str = "tryon"
    redis_url: str
    celery_broker_url: str
    celery_result_backend: str
    minio_endpoint: str
    minio_access_key: str
    minio_secret_key: str
    minio_bucket: str = "tryon-private"
    minio_secure: bool = False
    jwe_key_base64: str
    access_token_minutes: int = 15
    base_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000"
    admin_username: str
    admin_email: str
    admin_password: str
    smtp_host: str
    smtp_port: int = 1025
    smtp_from: str
    smtp_starttls: bool = False
    smtp_username: str = ""
    smtp_password: str = ""
    max_image_mb: int = 10
    max_image_pixels: int = 20_000_000
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self):
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
