"""
Manejo global de errores RFC 7807 (Problem Details for HTTP APIs).

Jerarquía de excepciones de dominio:
    AppError (500, INTERNAL_ERROR)
    ├── ValidationAppError   → 422, VALIDATION_ERROR
    ├── UnauthorizedError    → 401, UNAUTHORIZED
    ├── ForbiddenError       → 403, FORBIDDEN
    ├── NotFoundError        → 404, NOT_FOUND
    ├── ConflictError        → 409, CONFLICT
    └── RateLimitedError     → 429, RATE_LIMITED

Todos los handlers se registran en create_app() via register_exception_handlers().
"""

import logging
import traceback
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)

BASE_ERROR_URL = "https://foodstore.app/errors"


# ── Schema RFC 7807 ──────────────────────────────────────────────────────────


class ValidationErrorItem(BaseModel):
    field: str
    message: str
    type: str


class ProblemDetails(BaseModel):
    type: str
    title: str
    status: int
    detail: str
    instance: str
    code: str
    errors: list[ValidationErrorItem] | None = None
    extensions: dict[str, Any] | None = None


# ── Excepciones de dominio ───────────────────────────────────────────────────


class AppError(Exception):
    """Excepción base de dominio. Mapeada a 500 por defecto."""

    status_code: int = 500
    code: str = "INTERNAL_ERROR"
    title: str = "Internal Server Error"

    def __init__(
        self,
        detail: str = "Ocurrió un error interno.",
        extensions: dict[str, Any] | None = None,
    ) -> None:
        self.detail = detail
        self.extensions = extensions
        super().__init__(detail)


class ValidationAppError(AppError):
    status_code = 422
    code = "VALIDATION_ERROR"
    title = "Validation Error"

    def __init__(self, detail: str = "La solicitud no pasó validación.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


class UnauthorizedError(AppError):
    status_code = 401
    code = "UNAUTHORIZED"
    title = "Unauthorized"

    def __init__(self, detail: str = "Autenticación requerida.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


class ForbiddenError(AppError):
    status_code = 403
    code = "FORBIDDEN"
    title = "Forbidden"

    def __init__(self, detail: str = "No tenés permiso para realizar esta acción.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


class NotFoundError(AppError):
    status_code = 404
    code = "NOT_FOUND"
    title = "Not Found"

    def __init__(self, detail: str = "Recurso no encontrado.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


class ConflictError(AppError):
    status_code = 409
    code = "CONFLICT"
    title = "Conflict"

    def __init__(self, detail: str = "Conflicto con el estado actual del recurso.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


class RateLimitedError(AppError):
    status_code = 429
    code = "RATE_LIMITED"
    title = "Too Many Requests"

    def __init__(self, detail: str = "Demasiadas solicitudes. Intentá más tarde.", **kwargs: Any) -> None:
        super().__init__(detail, **kwargs)


# ── Helpers ──────────────────────────────────────────────────────────────────


def _problem_response(
    status: int,
    code: str,
    title: str,
    detail: str,
    instance: str,
    errors: list[ValidationErrorItem] | None = None,
    extensions: dict[str, Any] | None = None,
) -> JSONResponse:
    """Construye una JSONResponse con Content-Type: application/problem+json."""
    body: dict[str, Any] = {
        "type": f"{BASE_ERROR_URL}/{code.lower().replace('_', '-')}",
        "title": title,
        "status": status,
        "detail": detail,
        "instance": instance,
        "code": code,
    }
    if errors is not None:
        body["errors"] = [e.model_dump() for e in errors]
    if extensions:
        body.update(extensions)

    return JSONResponse(
        status_code=status,
        content=body,
        media_type="application/problem+json",
    )


def _format_validation_field(loc: tuple[Any, ...]) -> str:
    """Convierte la tupla de ubicación de Pydantic en un path legible.

    Ejemplos:
        ('body', 'email')         → 'email'
        ('body', 'items', 0, 'cantidad') → 'items[0].cantidad'
    """
    parts: list[str] = []
    for segment in loc:
        if segment == "body":
            continue
        if isinstance(segment, int):
            if parts:
                parts[-1] = f"{parts[-1]}[{segment}]"
            else:
                parts.append(f"[{segment}]")
        else:
            parts.append(str(segment))
    return ".".join(parts) if parts else "unknown"


# ── Handlers ─────────────────────────────────────────────────────────────────


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handler para excepciones de dominio (AppError y subclases)."""
    return _problem_response(
        status=exc.status_code,
        code=exc.code,
        title=exc.title,
        detail=exc.detail,
        instance=str(request.url.path),
        extensions=exc.extensions,
    )


async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handler para errores de validación de Pydantic (422)."""
    errors = [
        ValidationErrorItem(
            field=_format_validation_field(error["loc"]),
            message=error["msg"],
            type=error["type"],
        )
        for error in exc.errors()
    ]
    return _problem_response(
        status=422,
        code="VALIDATION_ERROR",
        title="Validation Error",
        detail="La solicitud no pasó validación. Revisá los campos indicados.",
        instance=str(request.url.path),
        errors=errors,
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handler para HTTPException de FastAPI/Starlette — reformatea a problem+json."""
    # Mapeo de status a code semántico
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        410: "GONE",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMITED",
        500: "INTERNAL_ERROR",
        503: "SERVICE_UNAVAILABLE",
    }
    title_map = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        409: "Conflict",
        410: "Gone",
        422: "Unprocessable Entity",
        429: "Too Many Requests",
        500: "Internal Server Error",
        503: "Service Unavailable",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    title = title_map.get(exc.status_code, "HTTP Error")
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

    return _problem_response(
        status=exc.status_code,
        code=code,
        title=title,
        detail=detail,
        instance=str(request.url.path),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all para excepciones no controladas (500).

    En prod: devuelve body genérico sin detalles de implementación.
    En dev: incluye el tipo de excepción para facilitar debugging.
    """
    # Importación local para evitar dependencia circular en el módulo de errors
    from app.core.config import get_settings

    settings = get_settings()

    logger.error(
        "Excepción no controlada: %s %s — %s: %s\n%s",
        request.method,
        request.url.path,
        exc.__class__.__name__,
        str(exc),
        traceback.format_exc(),
    )

    if settings.ENV == "dev":
        detail = f"[{exc.__class__.__name__}] {exc}"
    else:
        detail = "Ocurrió un error inesperado. Por favor intentá más tarde."

    return _problem_response(
        status=500,
        code="INTERNAL_ERROR",
        title="Internal Server Error",
        detail=detail,
        instance=str(request.url.path),
    )


# ── Registro ─────────────────────────────────────────────────────────────────


def register_exception_handlers(app: FastAPI) -> None:
    """Registra los cuatro handlers en la app FastAPI.

    El orden importa: los más específicos van primero.
    AppError va antes de Exception para que las subclases sean capturadas correctamente.
    """
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_exception_handler)  # type: ignore[arg-type]
