from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "KSP AI Platform"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]
    GEMINI_API_KEY: str | None = None
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:post@localhost:5432/ksp_ai_crime"

    # Catalyst API Gateway (off by default — see app/catalyst/gateway.py)
    CATALYST_GATEWAY_ENABLED: bool = False
    CATALYST_GATEWAY_API_KEY: str | None = None

    # Zoho Catalyst project credentials
    CATALYST_PROJECT_ID: str | None = None
    CATALYST_CLIENT_ID: str | None = None
    CATALYST_CLIENT_SECRET: str | None = None
    # A valid refresh_token is required to obtain bearer access tokens.
    # Generate one from https://api-console.zoho.in/ after authorizing scopes:
    # ZohoCatalyst.projects.READ,ZohoCatalyst.process.ALL
    CATALYST_REFRESH_TOKEN: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
