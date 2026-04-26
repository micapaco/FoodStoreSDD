"""
Middlewares transversales del backend.

BodySizeLimitMiddleware: rechaza requests con Content-Length > MAX_BODY_SIZE_BYTES
devolviendo 413 Payload Too Large en formato RFC 7807.
"""

from collections.abc import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    """Middleware ASGI que rechaza payloads que superan el límite configurado.

    Revisa el header Content-Length antes de leer el body.
    Si falta el header y el body es un stream, no puede rechazarlo en esta etapa;
    el límite por Content-Length es la forma más eficiente para requests normales.

    El límite se configura en Settings.MAX_BODY_SIZE_BYTES (default 1 MB).
    """

    def __init__(self, app: ASGIApp, max_body_size: int) -> None:
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                size = int(content_length)
            except ValueError:
                size = 0

            if size > self.max_body_size:
                body = {
                    "type": "https://foodstore.app/errors/payload-too-large",
                    "title": "Payload Too Large",
                    "status": 413,
                    "detail": (
                        f"El cuerpo de la solicitud supera el límite permitido "
                        f"de {self.max_body_size} bytes."
                    ),
                    "instance": str(request.url.path),
                    "code": "PAYLOAD_TOO_LARGE",
                }
                return JSONResponse(
                    status_code=413,
                    content=body,
                    media_type="application/problem+json",
                )

        return await call_next(request)
