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

    # ── Categorías jerárquicas ─────────────────────────────────────────────────
    # Root categories: insert idempotente, luego usamos RETURNING para obtener IDs
    roots = {
        "Bebidas": {"nombre": "Bebidas"},
        "Comidas": {"nombre": "Comidas"},
        "Snacks": {"nombre": "Snacks"},
        "Postres": {"nombre": "Postres"},
        "Salsas y Aderezos": {"nombre": "Salsas y Aderezos"},
    }

    root_ids: dict[str, int] = {}
    for root_name, root_data in roots.items():
        # Check if exists first
        existing = await session.execute(
            text("SELECT id FROM categoria WHERE nombre = :nombre"),
            root_data,
        )
        row = existing.fetchone()
        if row:
            root_ids[root_name] = row[0]
        else:
            result = await session.execute(
                text("INSERT INTO categoria (nombre) VALUES (:nombre) RETURNING id"),
                root_data,
            )
            root_ids[root_name] = result.scalar_one()

    # Subcategories: requieren parent_id
    subcategorias = [
        {"nombre": "Gaseosas", "parent_id": root_ids["Bebidas"]},
        {"nombre": "Aguas", "parent_id": root_ids["Bebidas"]},
        {"nombre": "Jugos", "parent_id": root_ids["Bebidas"]},
        {"nombre": "Hamburguesas", "parent_id": root_ids["Comidas"]},
        {"nombre": "Pizzas", "parent_id": root_ids["Comidas"]},
        {"nombre": "Empanadas", "parent_id": root_ids["Comidas"]},
    ]
    for sub in subcategorias:
        await session.execute(
            text(
                "INSERT INTO categoria (nombre, parent_id) "
                "VALUES (:nombre, :parent_id) "
                "ON CONFLICT ON CONSTRAINT uq_categoria_nombre DO NOTHING"
            ),
            sub,
        )

    # ── Ingredientes ────────────────────────────────────────────────────────────
    # No alérgenos
    ingredientes_no_alergenos = [
        {"nombre": "Queso", "es_alergeno": False},
        {"nombre": "Lechuga", "es_alergeno": False},
        {"nombre": "Tomate", "es_alergeno": False},
        {"nombre": "Cebolla", "es_alergeno": False},
        {"nombre": "Huevo", "es_alergeno": False},
    ]
    for ing in ingredientes_no_alergenos:
        await session.execute(
            text(
                "INSERT INTO ingrediente (nombre, es_alergeno) "
                "VALUES (:nombre, :es_alergeno) "
                "ON CONFLICT (nombre) DO NOTHING"
            ),
            ing,
        )

    # Alérgenos
    ingredientes_alergenos = [
        {"nombre": "Gluten", "es_alergeno": True},
        {"nombre": "Leche", "es_alergeno": True},
        {"nombre": "Maní", "es_alergeno": True},
        {"nombre": "Soja", "es_alergeno": True},
        {"nombre": "Mostaza", "es_alergeno": True},
    ]
    for ing in ingredientes_alergenos:
        await session.execute(
            text(
                "INSERT INTO ingrediente (nombre, es_alergeno) "
                "VALUES (:nombre, :es_alergeno) "
                "ON CONFLICT (nombre) DO NOTHING"
            ),
            ing,
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
