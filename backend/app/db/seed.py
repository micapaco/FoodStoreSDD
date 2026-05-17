"""Script seed idempotente.

Inserta los datos mínimos necesarios para que el sistema funcione:
catálogos base (Rol, EstadoPedido, FormaPago) y usuario admin inicial.

Uso:
    python -m app.db.seed

Requiere que `alembic upgrade head` haya sido ejecutado previamente.
"""

import asyncio
import shutil
import sys
from pathlib import Path

from passlib.context import CryptContext
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SEED_IMAGE_SOURCE_DIR = Path(__file__).resolve().parents[1] / "modules" / "productos" / "imagenes"
SEED_IMAGE_TARGET_DIR = Path(__file__).resolve().parents[1] / "static" / "uploads" / "productos" / "seed"
SEED_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
SEED_IMAGE_URL_PREFIX = "/static/uploads/productos/seed/"


def _prepare_seed_image(asset_name: str) -> str | None:
    """Publica una imagen seed si existe y retorna una URL local servida por FastAPI."""
    for extension in SEED_IMAGE_EXTENSIONS:
        source = SEED_IMAGE_SOURCE_DIR / f"{asset_name}{extension}"
        if not source.exists():
            continue
        SEED_IMAGE_TARGET_DIR.mkdir(parents=True, exist_ok=True)
        target = SEED_IMAGE_TARGET_DIR / source.name
        if not target.exists() or target.stat().st_size != source.stat().st_size:
            shutil.copy2(source, target)
        return f"{SEED_IMAGE_URL_PREFIX}{source.name}"
    return None


def _can_replace_seed_image(current_url: str | None) -> bool:
    """Evita pisar una imagen cargada manualmente por un admin."""
    if not current_url:
        return True
    return SEED_IMAGE_URL_PREFIX in current_url


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
                "INSERT INTO usuario (nombre, apellido, email, password_hash, "
                "created_at, updated_at) "
                "VALUES (:nombre, :apellido, :email, :password_hash, "
                "NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc') RETURNING id"
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
                text(
                    "INSERT INTO categoria (nombre, created_at, updated_at) "
                    "VALUES (:nombre, NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc') RETURNING id"
                ),
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
        existing = await session.execute(
            text("SELECT id FROM categoria WHERE lower(btrim(nombre)) = lower(btrim(:nombre)) AND deleted_at IS NULL"),
            {"nombre": sub["nombre"]},
        )
        if existing.fetchone() is not None:
            continue
        await session.execute(
            text(
                "INSERT INTO categoria (nombre, parent_id, "
                "created_at, updated_at) "
                "VALUES (:nombre, :parent_id, "
                "NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc')"
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
                "INSERT INTO ingrediente (nombre, es_alergeno, "
                "created_at, updated_at) "
                "VALUES (:nombre, :es_alergeno, "
                "NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc') "
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
                "INSERT INTO ingrediente (nombre, es_alergeno, "
                "created_at, updated_at) "
                "VALUES (:nombre, :es_alergeno, "
                "NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc') "
                "ON CONFLICT (nombre) DO NOTHING"
            ),
            ing,
        )

    # ── Productos ─────────────────────────────────────────────────────────────
    # Lookup categoria IDs by nombre
    cat_result = await session.execute(
        text(
            "SELECT id, nombre FROM categoria "
            "WHERE nombre IN ('Pizzas', 'Hamburguesas', 'Gaseosas', 'Aguas', 'Snacks', 'Postres')"
        )
    )
    cat_map: dict[str, int] = {row.nombre: row.id for row in cat_result.fetchall()}

    # Lookup ingrediente IDs by nombre
    ing_result = await session.execute(
        text(
            "SELECT id, nombre FROM ingrediente "
            "WHERE nombre IN ('Queso', 'Lechuga', 'Tomate', 'Cebolla')"
        )
    )
    ing_map: dict[str, int] = {row.nombre: row.id for row in ing_result.fetchall()}

    # Define products with their relations
    productos_seed = [
        {
            "nombre": "Pizza Mozzarella",
            "descripcion": "Pizza clásica con queso mozzarella y salsa de tomate",
            "precio_base": 1200.00,
            "stock_cantidad": 50,
            "disponible": True,
            "imagen_asset": "pizza",
            "categorias": ["Pizzas"],
            "ingredientes": [
                {"nombre": "Queso", "es_removible": False},
                {"nombre": "Tomate", "es_removible": False},
            ],
        },
        {
            "nombre": "Hamburguesa Clásica",
            "descripcion": "Hamburguesa con carne, queso, lechuga, tomate y cebolla",
            "precio_base": 850.00,
            "stock_cantidad": 30,
            "disponible": True,
            "imagen_asset": "hamburguesa",
            "categorias": ["Hamburguesas"],
            "ingredientes": [
                {"nombre": "Queso", "es_removible": True},
                {"nombre": "Lechuga", "es_removible": True},
                {"nombre": "Tomate", "es_removible": True},
                {"nombre": "Cebolla", "es_removible": True},
            ],
        },
        {
            "nombre": "Coca-Cola 500ml",
            "descripcion": "Gaseosa Coca-Cola sabor original 500ml",
            "precio_base": 250.00,
            "stock_cantidad": 100,
            "disponible": True,
            "imagen_asset": "cocacola",
            "categorias": ["Gaseosas"],
            "ingredientes": [],
        },
        {
            "nombre": "Agua Mineral 500ml",
            "descripcion": "Agua mineral sin gas 500ml",
            "precio_base": 200.00,
            "stock_cantidad": 80,
            "disponible": True,
            "imagen_asset": "agua",
            "categorias": ["Aguas"],
            "ingredientes": [],
        },
        {
            "nombre": "Papas Fritas",
            "descripcion": "Porción de papas fritas crujientes",
            "precio_base": 400.00,
            "stock_cantidad": 60,
            "disponible": True,
            "imagen_asset": "papas",
            "categorias": ["Snacks"],
            "ingredientes": [],
        },
        {
            "nombre": "Flan con Crema",
            "descripcion": "Flan casero con crema chantillí",
            "precio_base": 500.00,
            "stock_cantidad": 20,
            "disponible": True,
            "imagen_asset": "flan",
            "categorias": ["Postres"],
            "ingredientes": [],
        },
    ]

    for prod in productos_seed:
        imagen_url = _prepare_seed_image(str(prod["imagen_asset"]))

        # Idempotent: skip if producto.nombre already exists
        existing = await session.execute(
            text("SELECT id, imagen_url FROM producto WHERE nombre = :nombre"),
            {"nombre": prod["nombre"]},
        )
        existing_row = existing.fetchone()
        if existing_row is not None:
            if imagen_url and _can_replace_seed_image(existing_row.imagen_url):
                await session.execute(
                    text(
                        "UPDATE producto SET imagen_url = :imagen_url, "
                        "updated_at = NOW() AT TIME ZONE 'utc' "
                        "WHERE id = :id"
                    ),
                    {"id": existing_row.id, "imagen_url": imagen_url},
                )
            continue

        # Insert producto
        result = await session.execute(
            text(
                "INSERT INTO producto (nombre, descripcion, precio_base, "
                "stock_cantidad, disponible, imagen_url, "
                "created_at, updated_at) "
                "VALUES (:nombre, :descripcion, :precio_base, "
                ":stock_cantidad, :disponible, :imagen_url, "
                "NOW() AT TIME ZONE 'utc', NOW() AT TIME ZONE 'utc') RETURNING id"
            ),
            {
                "nombre": prod["nombre"],
                "descripcion": prod["descripcion"],
                "precio_base": prod["precio_base"],
                "stock_cantidad": prod["stock_cantidad"],
                "disponible": prod["disponible"],
                "imagen_url": imagen_url,
            },
        )
        producto_id = result.scalar_one()

        # Asignar categorías
        for cat_name in prod["categorias"]:
            cat_id = cat_map.get(cat_name)
            if cat_id is not None:
                await session.execute(
                    text(
                        "INSERT INTO producto_categoria (producto_id, categoria_id) "
                        "VALUES (:producto_id, :categoria_id) ON CONFLICT DO NOTHING"
                    ),
                    {"producto_id": producto_id, "categoria_id": cat_id},
                )

        # Asignar ingredientes con es_removible
        for ing_data in prod["ingredientes"]:
            ing_id = ing_map.get(ing_data["nombre"])
            if ing_id is not None:
                await session.execute(
                    text(
                        "INSERT INTO producto_ingrediente (producto_id, ingrediente_id, es_removible) "
                        "VALUES (:producto_id, :ingrediente_id, :es_removible) ON CONFLICT DO NOTHING"
                    ),
                    {
                        "producto_id": producto_id,
                        "ingrediente_id": ing_id,
                        "es_removible": ing_data["es_removible"],
                    },
                )

    # ── Configuración del sistema ─────────────────────────────────────────────
    configuraciones = [
        {"clave": "costo_envio_base", "valor": "50.00"},
        {"clave": "pedidos_habilitados", "valor": "true"},
        {"clave": "mensaje_sistema", "valor": ""},
    ]
    for cfg in configuraciones:
        await session.execute(
            text(
                "INSERT INTO configuracion (clave, valor, updated_at) "
                "VALUES (:clave, :valor, NOW()) ON CONFLICT DO NOTHING"
            ),
            cfg,
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
