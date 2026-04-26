"""
Handlers HTTP RFC 7807 (Problem Details for HTTP APIs).

Este módulo es un interface adapter: convierte excepciones de dominio y de
framework en responses HTTP con formato application/problem+json.

Las excepciones de dominio (AppError y subclases) viven en core/exceptions.py
para que cualquier capa pueda importarlas sin depender de HTTP ni FastAPI.

Registro:
    register_exception_handlers(app, settings) en create_app()
"""

import logging
import traceback
from collections.abc import Callable
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from starlette.exceptions import HTTPException

from app.core.config import Settings
from app.core.exceptions import AppError

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


# ── Helper ───────────────────────────────────────────────────────────────────


def _problem_response(
    status: int,
    code: str,
    title: str,
    detail: str,
    instance: str,
    errors: list[ValidationErrorItem] | None = None,
    extensions: dict[str, Any] | None = None,
) -> JSONResponse:
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
        ('body', 'email')              → 'email'
        ('body', 'items', 0, 'qty')    → 'items[0].qty'
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


def make_unhandled_handler(settings: Settings) -> Callable:
    """Factory que cierra sobre settings para evitar re-importar en cada request."""

    async def handler(request: Request, exc: Exception) -> JSONResponse:
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

    return handler


# ── Registro ─────────────────────────────────────────────────────────────────


def register_exception_handlers(app: FastAPI, settings: Settings) -> None:
    """Registra los cuatro handlers en la app FastAPI.

    El orden importa: los más específicos van primero.
    AppError va antes de Exception para capturar subclases correctamente.
    """
    app.add_exception_handler(AppError, app_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_exception_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, make_unhandled_handler(settings))  # type: ignore[arg-type]
