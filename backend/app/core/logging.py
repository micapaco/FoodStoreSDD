"""
Configuración de logging estándar del backend.

Nivel INFO en dev/test, WARNING en prod.
Los handlers de errores 5xx usan el logger del módulo errors.py.
"""

import logging
import sys

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    """Configura el nivel y formato de logging según el entorno."""
    nivel = logging.INFO if settings.ENV in ("dev", "test") else logging.WARNING

    logging.basicConfig(
        level=nivel,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,  # reemplaza cualquier config previa (ej: de uvicorn)
    )

    # Silenciar loggers ruidosos de terceros en prod
    if settings.ENV == "prod":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("fastapi").setLevel(logging.WARNING)
