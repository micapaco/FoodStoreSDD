"""
Dependencias FastAPI reutilizables para autenticación y autorización.

Patrón: dependency injection idiomático de FastAPI.
Los routers inyectan estas funciones con Depends() — nunca las llaman directamente.

Funciones exportadas:
- get_current_user: valida JWT Bearer, carga usuario desde BD, retorna Usuario
- get_optional_current_user: como get_current_user pero retorna None si no hay token
- require_role: factory que retorna una dependency que verifica rol(es)
"""

from collections.abc import Callable
from typing import Annotated, Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import verify_token
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario

# HTTPBearer muestra en Swagger un campo simple para pegar el token — más claro que OAuth2PasswordBearer.
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Usuario:
    """Valida el Bearer JWT y retorna el Usuario autenticado.

    Pasos:
    1. Extrae el token del header Authorization: Bearer <token>
    2. Decodifica y valida la firma + expiración (via security.verify_token)
    3. Carga el Usuario desde BD usando el claim 'sub' (user id)
    4. Verifica que el usuario exista y no esté soft-deleted

    Raises:
        UnauthorizedError: token ausente, inválido, expirado, o usuario no encontrado
    """
    if credentials is None:
        raise UnauthorizedError("Se requiere autenticación. Incluí el header Authorization: Bearer <token>.")

    # Decodificar y validar JWT — lanza UnauthorizedError si falla
    payload = verify_token(credentials.credentials)

    user_id_str = payload.get("sub")
    try:
        user_id = int(user_id_str)  # type: ignore[arg-type]
    except (TypeError, ValueError) as exc:
        raise UnauthorizedError("Token con claim 'sub' inválido.") from exc

    # Cargar el usuario desde BD
    async with UnitOfWork() as uow:
        result = await uow.usuarios.get_with_roles(user_id)

    if result is None:
        raise UnauthorizedError("Usuario no encontrado o inactivo.")

    # Retornar el modelo Usuario — los roles viajan en el JWT, no necesitamos cargarlos aquí
    usuario, _ = result
    return usuario


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> Optional[Usuario]:
    """Versión de get_current_user que retorna None en vez de lanzar error.

    Útil para endpoints que son públicos pero tienen comportamiento
    extendido para usuarios autenticados (ej: admin ve productos no disponibles).
    """
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials)
    except (UnauthorizedError, ForbiddenError):
        return None


def require_role(roles: list[str]) -> Callable:
    """Factory de dependency para RBAC.

    Uso en router:
        @router.get("/admin", dependencies=[Depends(require_role(["ADMIN"]))])

    O con inyección del usuario:
        @router.get("/admin")
        async def handler(current_user: Usuario = Depends(require_role(["ADMIN"]))):
            ...

    Args:
        roles: Lista de roles permitidos (OR — basta con tener uno).

    Returns:
        Dependency callable que retorna el Usuario si el rol es válido.

    Raises:
        UnauthorizedError: sin token válido
        ForbiddenError: token válido pero rol insuficiente
    """
    async def _check_role(
        current_user: Annotated[Usuario, Depends(get_current_user)],
    ) -> Usuario:
        # Cargar roles desde BD para la verificación (el JWT puede estar stale)
        async with UnitOfWork() as uow:
            result = await uow.usuarios.get_with_roles(current_user.id)  # type: ignore[arg-type]

        if result is None:
            raise UnauthorizedError("Usuario no encontrado o inactivo.")

        _, user_roles = result
        if "ADMIN" not in user_roles and not any(role in user_roles for role in roles):
            raise ForbiddenError(
                f"Se requiere uno de los siguientes roles: {', '.join(roles)}."
            )
        return current_user

    return _check_role
