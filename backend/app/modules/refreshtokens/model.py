"""
Módulo refreshtokens — modelo de dominio.

Re-exporta RefreshToken desde app/db/models/identidad.py.
No redefinir la tabla — ya existe en BD via la migración de infra-database.

NOTA DE IMPLEMENTACIÓN: El modelo en identidad.py no incluye el campo family_id
que requiere el diseño de detección de replay attack (D-03 en design.md).
Se requiere una migración adicional para agregar la columna family_id UUID NOT NULL
a la tabla refresh_token. Ver desviación reportada en tasks.md.
"""

from app.db.models.identidad import RefreshToken

__all__ = ["RefreshToken"]
