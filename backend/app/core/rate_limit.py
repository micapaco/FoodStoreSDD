"""
Infraestructura de rate limiting con slowapi.

El Limiter se configura con settings al importar el módulo:
- default_limits: tomado de Settings.RATE_LIMIT_DEFAULT ("60/minute" por defecto).
  Los endpoints pueden sobreescribirlo con @limiter.limit("5/15minutes").
- storage_uri: None usa memoria (dev/test); Redis se activa vía
  Settings.RATE_LIMIT_STORAGE_URI sin cambiar código.

Uso en un endpoint:
    from app.core.rate_limit import limiter

    @router.post("/login")
    @limiter.limit("5/15minutes")
    async def login(request: Request, ...):
        ...

El parámetro `request: Request` es OBLIGATORIO en endpoints con rate limit
porque slowapi lo necesita para extraer la IP del cliente.
"""

import logging

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)


def _create_limiter() -> Limiter:
    from app.core.config import get_settings

    settings = get_settings()
    kwargs: dict = {
        "key_func": get_remote_address,
        "default_limits": [settings.RATE_LIMIT_DEFAULT],
    }
    if settings.RATE_LIMIT_STORAGE_URI:
        kwargs["storage_uri"] = settings.RATE_LIMIT_STORAGE_URI
    return Limiter(**kwargs)


# Singleton importable desde cualquier router para aplicar @limiter.limit(...)
limiter = _create_limiter()


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Handler para RateLimitExceeded de slowapi — RFC 7807 con Retry-After."""
    retry_after = getattr(exc, "retry_after", None)

    body = {
        "type": "https://foodstore.app/errors/rate-limited",
        "title": "Too Many Requests",
        "status": 429,
        "detail": str(exc.detail) if hasattr(exc, "detail") else "Demasiadas solicitudes. Intentá más tarde.",
        "instance": str(request.url.path),
        "code": "RATE_LIMITED",
    }

    return JSONResponse(
        status_code=429,
        content=body,
        media_type="application/problem+json",
        headers={"Retry-After": str(int(retry_after)) if retry_after else "60"},
    )
