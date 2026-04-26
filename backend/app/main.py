"""
Entry point del backend de Food Store.

Patrón app factory: create_app() construye la instancia de FastAPI con su
configuración completa (middlewares, handlers, routers) y la exporta como `app`
para que uvicorn la levante.

Arranque:
    uvicorn backend.app.main:app --reload --port 8000

O desde la carpeta backend/:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import router as api_v1_router
from app.core.config import Settings, get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging
from app.core.middleware import BodySizeLimitMiddleware
from app.core.rate_limit import limiter, rate_limit_exceeded_handler

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Ciclo de vida de la aplicación — startup y shutdown explícitos."""
    settings: Settings = get_settings()
    logger.info(
        "Food Store backend started — versión %s, entorno: %s",
        settings.APP_VERSION,
        settings.ENV,
    )
    yield
    logger.info("Food Store backend shutting down")


def create_app() -> FastAPI:
    """Factory de la aplicación FastAPI.

    Orden de montaje:
    1. Settings + logging
    2. Instancia FastAPI con lifespan
    3. app.state (limiter)
    4. Middlewares (CORS → body size → slowapi) — se registran en orden inverso al de ejecución
    5. Exception handlers
    6. Routers
    """
    settings = get_settings()

    # 1. Logging
    configure_logging(settings)

    # 2. Instancia FastAPI
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="API REST de Food Store. Documentación: /docs o /redoc.",
        lifespan=lifespan,
        # En prod se puede deshabilitar docs si no se quiere exponer
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # 3. Estado global del limiter (accesible desde los routers vía request.app.state.limiter)
    app.state.limiter = limiter

    # 4. Middlewares
    # Nota: en Starlette los middlewares se ejecutan en orden INVERSO al de registro.
    # El orden de ejecución de request será: CORS → BodySizeLimit → SlowAPI → handlers

    # CORS — primer filtro que toca la request
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
    )

    # Límite de tamaño de payload
    app.add_middleware(BodySizeLimitMiddleware, max_body_size=settings.MAX_BODY_SIZE_BYTES)

    # SlowAPI — debe ir antes (registrado después) de CORS para que las respuestas 429
    # también incluyan los headers CORS
    app.add_middleware(SlowAPIMiddleware)

    # 5. Exception handlers
    register_exception_handlers(app, settings)
    # Handler específico de slowapi para RateLimitExceeded
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # 6. Routers
    app.include_router(api_v1_router)

    return app


# Instancia exportada para uvicorn
app = create_app()
