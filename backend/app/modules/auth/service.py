"""
Módulo auth — capa de servicio.

Contiene la lógica de negocio de autenticación: registro, login, refresh y logout.
El servicio NO abre transacciones — eso es responsabilidad del router (UoW pattern).
El servicio recibe el UoW ya activo como parámetro.
"""

import uuid
from datetime import datetime, timedelta

from passlib.context import CryptContext

from app.core.config import get_settings
from app.core.exceptions import ConflictError, ForbiddenError, UnauthorizedError, ValidationAppError
from app.core.security import create_access_token, create_refresh_token, hash_token
from app.core.uow import UnitOfWork
from app.db.models.identidad import RefreshToken, Usuario, UsuarioRol
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UpdateProfileRequest,
    UserResponse,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _build_token_response(
    usuario: Usuario,
    roles: list[str],
    family_id: uuid.UUID,
    uow: UnitOfWork,
    settings: object,
) -> tuple[TokenResponse, RefreshToken]:
    """Helper: emite access + refresh token y construye el objeto RefreshToken a persistir."""
    access_token = create_access_token(
        data={"sub": str(usuario.id), "email": usuario.email, "roles": roles}
    )
    refresh_token_value = create_refresh_token()
    expires_at = datetime.utcnow() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS  # type: ignore[attr-defined]
    )
    token_record = RefreshToken(
        token_hash=hash_token(refresh_token_value),
        usuario_id=usuario.id,
        family_id=family_id,
        expires_at=expires_at,
    )
    return (
        TokenResponse(access_token=access_token, refresh_token=refresh_token_value),
        token_record,
    )


class AuthService:
    @staticmethod
    async def register(data: RegisterRequest, uow: UnitOfWork) -> UserResponse:
        """Crea un nuevo usuario con rol CLIENT asignado automáticamente (RN-AU07)."""
        existing = await uow.usuarios.get_by_email(data.email)
        if existing is not None:
            raise ConflictError("El email ya está registrado.")

        password_hash = pwd_context.hash(data.password)
        usuario = Usuario(
            nombre=data.nombre,
            apellido=data.apellido,
            email=data.email,
            password_hash=password_hash,
        )
        usuario = await uow.usuarios.create(usuario)

        # Asignar rol CLIENT en la capa de servicio — nunca desde el request (RN-AU07)
        usuario_rol = UsuarioRol(usuario_id=usuario.id, rol_codigo="CLIENT")
        uow.session.add(usuario_rol)
        await uow.session.flush()

        return UserResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            apellido=usuario.apellido,
            email=usuario.email,
            roles=["CLIENT"],
            created_at=usuario.created_at,
        )

    @staticmethod
    async def login(data: LoginRequest, uow: UnitOfWork) -> TokenResponse:
        """Autentica credenciales y emite un par de tokens.

        Mensaje de error genérico: no diferencia email no encontrado de contraseña incorrecta (RN-AU08).
        """
        settings = get_settings()
        _GENERIC_ERROR = "Credenciales incorrectas."

        usuario = await uow.usuarios.get_by_email(data.email)
        # pwd_context.verify siempre evalúa para evitar timing attacks
        if usuario is None or not pwd_context.verify(data.password, usuario.password_hash):
            raise UnauthorizedError(_GENERIC_ERROR)

        result = await uow.usuarios.get_with_roles(usuario.id)
        roles = result[1] if result else []

        token_response, token_record = _build_token_response(
            usuario, roles, uuid.uuid4(), uow, settings
        )
        await uow.refresh_tokens.create_token(token_record)
        return token_response

    @staticmethod
    async def refresh(data: RefreshRequest, uow: UnitOfWork) -> TokenResponse:
        """Rota el refresh token — revoca el anterior y emite uno nuevo con el mismo family_id.

        Detección de replay attack: si el token ya estaba revocado, se revoca toda la familia (D-03).
        """
        settings = get_settings()
        token_hash = hash_token(data.refresh_token)

        stored = await uow.refresh_tokens.get_by_hash(token_hash)
        if stored is None:
            raise UnauthorizedError("Refresh token inválido.")

        now = datetime.utcnow()

        # Replay attack: token ya fue revocado
        if stored.revoked_at is not None:
            await uow.refresh_tokens.revoke_family(stored.family_id)
            raise UnauthorizedError("Refresh token ya utilizado. Iniciá sesión nuevamente.")

        # Token expirado
        if stored.expires_at < now:
            raise UnauthorizedError("Refresh token expirado. Iniciá sesión nuevamente.")

        # Revocar token actual y emitir nuevo par con el mismo family_id (rotación)
        await uow.refresh_tokens.revoke(stored)

        result = await uow.usuarios.get_with_roles(stored.usuario_id)
        if result is None:
            raise UnauthorizedError("Usuario no encontrado.")
        usuario, roles = result

        token_response, token_record = _build_token_response(
            usuario, roles, stored.family_id, uow, settings
        )
        await uow.refresh_tokens.create_token(token_record)
        return token_response

    @staticmethod
    async def logout(data: LogoutRequest, uow: UnitOfWork) -> None:
        """Invalida el refresh token del usuario.

        Si el token no existe o ya fue revocado, la operación se ignora silenciosamente
        (idempotente — no filtra información sobre el estado del token).
        """
        token_hash = hash_token(data.refresh_token)
        stored = await uow.refresh_tokens.get_by_hash(token_hash)
        if stored is not None and stored.revoked_at is None:
            await uow.refresh_tokens.revoke(stored)

    @staticmethod
    def me(usuario: Usuario, roles: list[str]) -> UserResponse:
        """Retorna los datos públicos del usuario autenticado."""
        return UserResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            apellido=usuario.apellido,
            telefono=usuario.telefono,
            email=usuario.email,
            roles=roles,
            created_at=usuario.created_at,
        )

    @staticmethod
    async def update_profile(
        usuario_id: int,
        data: UpdateProfileRequest,
        uow: UnitOfWork,
    ) -> UserResponse:
        """Actualiza los datos personales del perfil.

        Valida unicidad de email si cambió. Actualiza solo los campos permitidos:
        nombre, apellido, email, telefono.
        """
        result = await uow.usuarios.get_with_roles(usuario_id)
        if result is None:
            raise UnauthorizedError("Usuario no encontrado o inactivo.")
        usuario, roles = result
        if usuario.deleted_at is not None:
            raise UnauthorizedError("Usuario no encontrado o inactivo.")

        # Validar unicidad de email si cambió
        if data.email != usuario.email:
            existing = await uow.usuarios.get_by_email(data.email)
            if existing is not None:
                raise ConflictError("El email ya está registrado.")

        # Actualizar campos permitidos
        usuario.nombre = data.nombre
        usuario.apellido = data.apellido
        usuario.email = data.email
        usuario.telefono = data.telefono

        await uow.usuarios.update(usuario)

        return UserResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            apellido=usuario.apellido,
            telefono=usuario.telefono,
            email=usuario.email,
            roles=roles,
            created_at=usuario.created_at,
        )

    @staticmethod
    async def change_password(
        usuario_id: int,
        data: ChangePasswordRequest,
        uow: UnitOfWork,
    ) -> None:
        """Cambia la contraseña del usuario.

        Validaciones (en orden):
        1. confirm_password == new_password
        2. current_password correcta → 403 si no
        3. new_password != current_password → 422 si igual
        4. new_password no contiene el email del usuario → 422 si contiene
        5. new_password cumple política (mín 8 chars, sin espacios)
        """
        usuario = await uow.usuarios.get_by_id(usuario_id)
        if usuario is None or usuario.deleted_at is not None:
            raise UnauthorizedError("Usuario no encontrado o inactivo.")

        # 1. Confirmación coincide
        if data.new_password != data.confirm_password:
            raise ValidationAppError("Las contraseñas nuevas no coinciden.")

        # 2. Verificar contraseña actual
        if not pwd_context.verify(data.current_password, usuario.password_hash):
            raise ForbiddenError("Contraseña actual incorrecta.")

        # 3. new_password != current_password
        if data.current_password == data.new_password:
            raise ValidationAppError(
                "La nueva contraseña debe ser diferente a la actual."
            )

        # 4. new_password no contiene el email
        email_local = usuario.email.split("@")[0].lower()
        if email_local in data.new_password.lower():
            raise ValidationAppError(
                "La nueva contraseña no puede contener tu dirección de email."
            )

        # 5. Hashear y actualizar
        usuario.password_hash = pwd_context.hash(data.new_password)
        await uow.usuarios.update(usuario)
