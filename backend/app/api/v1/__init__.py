# Router raíz de la API v1.
# Todos los routers feature-first se incluyen acá a medida que se implementan los changes.
# Convención: nunca registrar endpoints fuera de este prefijo (excepto /docs, /redoc, /openapi.json).

from fastapi import APIRouter

from app.api.v1 import health

router = APIRouter(prefix="/api/v1")

router.include_router(health.router)
