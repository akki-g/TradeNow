from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):

    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "trading_user"
    DB_PASSWORD: str = "trading_pass_dev"
    DB_NAME: str = "trading_db"

    APP_NAME: str = "Trading Platform"
    DEBUG: bool = True

    AWS_REGION: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    @property
    def ALEMBIC_DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()