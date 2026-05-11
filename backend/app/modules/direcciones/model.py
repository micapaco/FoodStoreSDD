"""Módulo direcciones — modelo.

Re-export de DireccionEntrega desde app/db/models/identidad.py.
La tabla ya existe en BD (migraciones Alembic).
"""

from app.db.models.identidad import DireccionEntrega

__all__ = ["DireccionEntrega"]
