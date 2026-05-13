"""Importa todos los modelos para que Alembic los descubra via SQLModel.metadata."""

from app.db.models.configuracion import Configuracion
from app.db.models.catalogo import (
    Categoria,
    FormaPago,
    Ingrediente,
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)
from app.db.models.identidad import (
    DireccionEntrega,
    RefreshToken,
    Rol,
    Usuario,
    UsuarioRol,
)
from app.db.models.ventas import (
    DetallePedido,
    EstadoPedido,
    HistorialEstadoPedido,
    Pago,
    Pedido,
)

__all__ = [
    "Configuracion",
    "Rol",
    "Usuario",
    "UsuarioRol",
    "RefreshToken",
    "DireccionEntrega",
    "Categoria",
    "Ingrediente",
    "Producto",
    "ProductoCategoria",
    "ProductoIngrediente",
    "FormaPago",
    "EstadoPedido",
    "Pedido",
    "DetallePedido",
    "HistorialEstadoPedido",
    "Pago",
]
