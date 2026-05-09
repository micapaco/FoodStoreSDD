"""
Módulo refreshtokens — repositorio.

Extiende BaseRepository[RefreshToken] con operaciones específicas del ciclo
de vida del token: búsqueda por hash, revocación individual y por familia.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repository import BaseRepository
from app.db.models.identidad import RefreshToken


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, RefreshToken)

    async def get_by_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Busca un RefreshToken por su hash SHA-256. Retorna None si no existe."""
        result = await self.session.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken) -> None:
        """Marca un token como revocado (revoked_at = now). No hace flush — el UoW lo maneja."""
        token.revoked_at = datetime.utcnow()
        self.session.add(token)
        await self.session.flush()

    async def revoke_family(self, family_id: uuid.UUID) -> None:
        """Revoca todos los tokens activos de una familia (detección de replay attack).

        Usa UPDATE masivo en lugar de cargar cada fila en memoria — más eficiente
        cuando una familia puede tener múltiples tokens activos (multi-device).
        """
        now = datetime.utcnow()
        await self.session.execute(
            update(RefreshToken)
            .where(
                RefreshToken.family_id == family_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await self.session.flush()

    async def create_token(self, token: RefreshToken) -> RefreshToken:
        """Persiste un nuevo RefreshToken y retorna la instancia con id asignado."""
        return await self.create(token)
