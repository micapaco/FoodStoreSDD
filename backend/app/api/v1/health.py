"""
Endpoint de health check — GET /api/v1/health

Verifica que el servidor está corriendo. NO ejecuta consultas a la base de datos.
Cuando exista infra-database se podrá agregar GET /api/v1/health/db por separado.
"""

from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    summary="Health check",
    description="Verifica que el servidor está corriendo. No depende de la base de datos.",
    response_description="Estado del servicio",
)
async def health_check(settings: Settings = Depends(get_settings)) -> dict:
    return {
        "status": "ok",
        "service": "foodstore-backend",
        "version": settings.APP_VERSION,
    }
