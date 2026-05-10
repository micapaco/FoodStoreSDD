"""
Módulo auth — router HTTP.

Responsabilidad: parsear request, abrir UoW, delegar al servicio, serializar respuesta.
Sin lógica de negocio — eso pertenece a AuthService.
"""

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import Response

from app.core.deps import get_current_user
from app.core.rate_limit import limiter
from app.core.uow import UnitOfWork
from app.db.models.identidad import Usuario
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
from app.modules.auth.service import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
async def register(data: RegisterRequest) -> UserResponse:
    async with UnitOfWork() as uow:
        return await AuthService.register(data, uow)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(request: Request, data: LoginRequest) -> TokenResponse:
    # request: Request es obligatorio para que slowapi extraiga la IP del cliente
    async with UnitOfWork() as uow:
        return await AuthService.login(data, uow)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest) -> TokenResponse:
    async with UnitOfWork() as uow:
        return await AuthService.refresh(data, uow)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    data: LogoutRequest,
    _current_user: Usuario = Depends(get_current_user),
) -> Response:
    async with UnitOfWork() as uow:
        await AuthService.logout(data, uow)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserResponse)
async def me(current_user: Usuario = Depends(get_current_user)) -> UserResponse:
    async with UnitOfWork() as uow:
        result = await uow.usuarios.get_with_roles(current_user.id)  # type: ignore[arg-type]
    roles = result[1] if result else []
    return AuthService.me(current_user, roles)


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UpdateProfileRequest,
    current_user: Usuario = Depends(get_current_user),
) -> UserResponse:
    async with UnitOfWork() as uow:
        return await AuthService.update_profile(current_user.id, data, uow)  # type: ignore[arg-type]


@router.put("/change-password", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    async with UnitOfWork() as uow:
        await AuthService.change_password(current_user.id, data, uow)  # type: ignore[arg-type]
    return {"message": "Contraseña actualizada correctamente."}
