"""
Módulo usuarios — modelos de dominio.

Importa y re-exporta los modelos ya definidos en app/db/models/identidad.py
para que el módulo usuarios sea la fuente de verdad a nivel feature.
No redefinir tablas — las tablas ya existen en la BD via la migración de infra-database.
"""

from app.db.models.identidad import Rol, Usuario, UsuarioRol

__all__ = ["Usuario", "Rol", "UsuarioRol"]
