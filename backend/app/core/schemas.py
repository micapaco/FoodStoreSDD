"""
BaseSchema: configuración base de Pydantic v2 para todos los schemas del proyecto.

Todos los schemas de request DEBEN heredar de BaseSchema para garantizar:
- extra="forbid": rechaza campos no declarados (failsafe de contrato)
- str_strip_whitespace=True: limpia espacios en strings automáticamente
- populate_by_name=True: permite usar tanto alias como nombre de campo

Ejemplo:
    from app.core.schemas import BaseSchema

    class LoginRequest(BaseSchema):
        email: str
        password: str
"""

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        str_strip_whitespace=True,
        populate_by_name=True,
    )
