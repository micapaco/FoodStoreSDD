"""Script seed idempotente.

Inserta los datos mínimos necesarios para que el sistema funcione:
catálogos base (Rol, EstadoPedido, FormaPago) y usuario admin inicial.

Uso:
    python -m app.db.seed

Requiere que `alembic upgrade head` haya sido ejecutado previamente.
"""

import asyncio
import sys

from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed(session: AsyncSession) -> None:
    # ── Rol ──────────────────────────────────────────────────────────────────
    roles = [
        {"codigo": "ADMIN"},
        {"codigo": "STOCK"},
        {"codigo": "PEDIDOS"},
        {"codigo": "CLIENT"},
    ]
    for rol in roles:
        await session.execute(
            text("INSERT INTO rol (codigo) VALUES (:codigo) ON CONFLICT DO NOTHING"),
            rol,
        )

    # ── EstadoPedido ─────────────────────────────────────────────────────────
    estados = [
        {"codigo": "PENDIENTE", "orden": 1, "es_terminal": False},
        {"codigo": "CONFIRMADO", "orden": 2, "es_terminal": False},
        {"codigo": "EN_PREP", "orden": 3, "es_terminal": False},
        {"codigo": "EN_CAMINO", "orden": 4, "es_terminal": False},
        {"codigo": "ENTREGADO", "orden": 5, "es_terminal": True},
        {"codigo": "CANCELADO", "orden": 6, "es_terminal": True},
    ]
    for estado in estados:
        await session.execute(
            text(
                "INSERT INTO estado_pedido (codigo, orden, es_terminal) "
                "VALUES (:codigo, :orden, :es_terminal) ON CONFLICT DO NOTHING"
            ),
            estado,
        )

    # ── FormaPago ─────────────────────────────────────────────────────────────
    formas_pago = [
        {"codigo": "MERCADOPAGO", "habilitado": True},
        {"codigo": "EFECTIVO", "habilitado": True},
        {"codigo": "TRANSFERENCIA", "habilitado": True},
    ]
    for forma in formas_pago:
        await session.execute(
            text(
                "INSERT INTO forma_pago (codigo, habilitado) "
                "VALUES (:codigo, :habilitado) ON CONFLICT DO NOTHING"
            ),
            forma,
        )

    # ── Usuario admin ─────────────────────────────────────────────────────────
    admin_email = "admin@foodstore.com"
    existing = await session.execute(
        text("SELECT id FROM usuario WHERE email = :email"),
        {"email": admin_email},
    )
    if existing.fetchone() is None:
        password_hash = _pwd_context.hash("Admin1234!")
        result = await session.execute(
            text(
                "INSERT INTO usuario (nombre, apellido, email, password_hash) "
                "VALUES (:nombre, :apellido, :email, :password_hash) RETURNING id"
            ),
            {
                "nombre": "Admin",
                "apellido": "FoodStore",
                "email": admin_email,
                "password_hash": password_hash,
            },
        )
        admin_id = result.scalar_one()
        await session.execute(
            text(
                "INSERT INTO usuario_rol (usuario_id, rol_codigo) "
                "VALUES (:usuario_id, 'ADMIN') ON CONFLICT DO NOTHING"
            ),
            {"usuario_id": admin_id},
        )

    await session.commit()


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await seed(session)

    await engine.dispose()

    print("Seed completado.")
    print()
    print("[ADVERTENCIA DE SEGURIDAD]")
    print("   El usuario admin@foodstore.com fue creado con password 'Admin1234!'.")
    print("   CAMBIÁ este password ANTES de ir a producción.")
    print()


if __name__ == "__main__":
    asyncio.run(main())
