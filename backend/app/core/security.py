"""
Funciones de seguridad para JWT y tokens opacos.

Capa de infraestructura pura — sin dependencias de FastAPI ni de modelos de BD.
Importable desde cualquier capa sin acoplar al framework.

Funciones:
- create_access_token: emite un JWT HS256 con claims sub/email/roles/exp
- create_refresh_token: genera un UUID v4 opaco (string)
- hash_token: SHA-256 del token opaco para almacenamiento en BD
- verify_token: decodifica y valida un JWT; retorna claims o lanza excepción
"""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Emite un JWT access token firmado con HS256.

    Args:
        data: Claims a incluir. Debe tener al menos 'sub' (user id como str),
              'email' y 'roles' (list[str]).
        expires_delta: Tiempo de vida. Si es None usa JWT_ACCESS_TOKEN_EXPIRE_MINUTES.

    Returns:
        Token JWT como string.
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode["exp"] = expire

    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token() -> str:
    """Genera un token opaco UUID v4 para usar como refresh token.

    Returns:
        UUID v4 como string (ej: "550e8400-e29b-41d4-a716-446655440000").
        Almacenar en BD solo el hash SHA-256, nunca el valor en claro.
    """
    return str(uuid.uuid4())


def hash_token(token: str) -> str:
    """Calcula el SHA-256 de un token opaco para almacenamiento seguro en BD.

    Args:
        token: El token en texto plano (UUID v4).

    Returns:
        Hex digest SHA-256 de 64 caracteres.
    """
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token(token: str) -> dict[str, Any]:
    """Decodifica y valida un JWT access token.

    Verifica firma, expiración y presencia de claims obligatorios (sub, email, roles).

    Args:
        token: JWT como string.

    Returns:
        Diccionario con los claims del token.

    Raises:
        UnauthorizedError: Si el token es inválido, expirado o le faltan claims.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise UnauthorizedError("Token inválido o expirado.") from exc

    # Verificar claims obligatorios
    sub = payload.get("sub")
    email = payload.get("email")
    roles = payload.get("roles")

    if sub is None or email is None or roles is None:
        raise UnauthorizedError("Token con claims incompletos.")

    return payload
