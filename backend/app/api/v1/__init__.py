# Router raíz de la API v1.
# Todos los routers feature-first se incluyen acá a medida que se implementan los changes.
# Convención: nunca registrar endpoints fuera de este prefijo (excepto /docs, /redoc, /openapi.json).

from fastapi import APIRouter

from app.api.v1 import health
from app.modules.auth.router import router as auth_router
from app.modules.categorias.router import router as categorias_router
from app.modules.direcciones.router import router as direcciones_router
from app.modules.ingredientes.router import router as ingredientes_router
from app.modules.productos.router import router as productos_router
from app.modules.pedidos.router import router as pedidos_router

router = APIRouter(prefix="/api/v1")

router.include_router(health.router)
router.include_router(auth_router)
router.include_router(categorias_router)
router.include_router(direcciones_router)
router.include_router(ingredientes_router)
router.include_router(productos_router)
router.include_router(pedidos_router)
