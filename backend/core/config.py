"""Application configuration from environment variables."""
import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/cip"
    )

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
    ]

    # OpenRouter AI
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"
    DEFAULT_LLM_MODEL: str = "deepseek/deepseek-chat"

    # External APIs (all free)
    COINGECKO_BASE_URL: str = "https://api.coingecko.com/api/v3"
    DEFILLAMA_BASE_URL: str = "https://api.llama.fi"
    DEXSCREENER_BASE_URL: str = "https://api.dexscreener.com/latest"
    ALTERNATIVE_ME_BASE_URL: str = "https://api.alternative.me"

    # ETL Schedule
    MARKET_REFRESH_HOURS: int = 1
    PROTOCOL_REFRESH_HOURS: int = 6
    REPORT_REFRESH_HOURS: int = 24

    # App
    TOP_ASSETS_LIMIT: int = 20
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
