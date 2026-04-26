"""
Excepciones de dominio de Food Store.

Estas clases representan errores de negocio/aplicación — no conocen HTTP,
FastAPI ni ningún framework. Pueden importarse desde cualquier capa sin
riesgo de acoplar el dominio a infraestructura.

Uso:
    from app.core.exceptions import NotFoundError, ConflictError
    raise NotFoundError("Producto 42 no existe")

Los handlers que convierten estas excepciones a responses HTTP viven en
core/errors.py (interface adapter layer).
"""

from typing import Any


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
