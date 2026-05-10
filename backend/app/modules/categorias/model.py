"""
Módulo categorías — modelo de dominio.

Importa y re-exporta Categoria desde app/db/models/catalogo.py.
Las relaciones self-referential (parent, children) ya están definidas allí.
No redefinir tablas — la tabla ya existe en BD via la migración 0001.
"""

from app.db.models.catalogo import Categoria

__all__ = ["Categoria"]
