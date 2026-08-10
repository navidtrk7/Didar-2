from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE) if _ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )
    database_url: str = "postgresql+psycopg2://meysam@localhost:5432/didar"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"
    demo_seed: bool = True
    # Matches frontend dual-ledger posts: Math.round(... * 10)
    irt_to_irr: int = 10
    live_gold_price_per_gram: int = 18_578_200
    live_gold_karat: int = 18
    live_gold_source: str = "tgju.org"
    jwt_secret: str = "didar-dev-change-me-in-production"
    jwt_expire_hours: int = 72
    demo_password: str = "didar123"
    # Zarrin: test = deterministic local adapter; live = HTTP when URL+key set
    zarrin_mode: str = "test"
    zarrin_base_url: str = ""
    zarrin_api_key: str = ""
    # Destructive admin tools (reseed) only when demo tooling is on
    allow_destructive_admin: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
