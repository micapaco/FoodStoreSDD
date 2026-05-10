"""
Módulo ingredientes — modelo de dominio.

Importa y re-exporta Ingrediente desde app/db/models/catalogo.py.
No redefinir tablas — la tabla ya existe en BD via la migración 0001.
"""

from app.db.models.catalogo import Ingrediente

__all__ = ["Ingrediente"]
