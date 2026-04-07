"""
Application configuration management
Centralizes all configuration variables from environment
"""
import logging
from functools import lru_cache

from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = "sqlite:///./fleet.db"

    # Security
    secret_key: str = "dev-secret-key-change-in-production-use-env-variable"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # CORS
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Application
    app_name: str = "FRAS API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Email
    mail_username: str = "user@example.com"
    mail_password: str = "password"
    mail_from: str = "user@example.com"
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        "env_file_encoding": "utf-8",
    }


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    settings = Settings()

    if settings.secret_key == "dev-secret-key-change-in-production-use-env-variable":
        logger.warning("Using default SECRET_KEY! Set SECRET_KEY in .env for production!")

    if settings.database_url.startswith("sqlite"):
        logger.info("Using SQLite database for development")

    return settings
