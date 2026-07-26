from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import logger
from app.api.v1 import health, crimes, chat, biometrics, personnel, catalyst, network, auth

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

logger.info("Starting KSP Backend API")

# Catalyst API Gateway: off by default so the open demo API keeps working
# without a key. Set CATALYST_GATEWAY_ENABLED=true (and optionally
# CATALYST_GATEWAY_API_KEY) in .env to demo it.
if settings.CATALYST_GATEWAY_ENABLED:
    from app.catalyst.gateway import rate_limit_and_key_check

    @app.middleware("http")
    async def catalyst_gateway_middleware(request, call_next):
        return await rate_limit_and_key_check(request, call_next, settings.CATALYST_GATEWAY_API_KEY)

    logger.info("Catalyst API Gateway middleware enabled")

@app.get("/health")
def root_health_check():
    return {"status": "ok", "message": "Root Health check passed"}

app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(crimes.router, prefix=settings.API_V1_STR)
app.include_router(biometrics.router, prefix=settings.API_V1_STR)
app.include_router(personnel.router, prefix=settings.API_V1_STR)
app.include_router(catalyst.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/catalyst/auth")
app.include_router(network.router, prefix=settings.API_V1_STR)
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
