## ADDED Requirements

### Requirement: Configuración base estricta de Pydantic v2

El backend SHALL definir en `backend/app/core/schemas.py` una clase `BaseSchema(BaseModel)` con `model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)` que TODOS los schemas de request del proyecto SHALL heredar.

#### Scenario: Campo extra rechazado
- **GIVEN** un schema que hereda de `BaseSchema` con campos `email` y `password`
- **WHEN** el cliente envía `{"email":"a@b.com","password":"...","extra":"x"}`
- **THEN** Pydantic rechaza el request con error de validación 422 indicando "extra fields not permitted"

#### Scenario: Whitespace recortado
- **GIVEN** un schema que hereda de `BaseSchema` con campo `nombre: str`
- **WHEN** el cliente envía `{"nombre":"  Pedro  "}`
- **THEN** el handler recibe el valor `"Pedro"` (sin espacios externos)

### Requirement: Límite de tamaño del body de la request

La aplicación SHALL rechazar con HTTP 413 (`Payload Too Large`) toda request cuyo `Content-Length` exceda `Settings.MAX_BODY_SIZE_BYTES` (default 1 MB), respondiendo con un problem+json `code: "PAYLOAD_TOO_LARGE"`.

#### Scenario: Body dentro del límite
- **GIVEN** `Settings.MAX_BODY_SIZE_BYTES = 1_048_576`
- **WHEN** el cliente envía un body de 500 KB a un endpoint POST
- **THEN** el request es procesado normalmente

#### Scenario: Body excede el límite
- **GIVEN** `Settings.MAX_BODY_SIZE_BYTES = 1_048_576`
- **WHEN** el cliente envía un body de 2 MB a un endpoint POST
- **THEN** el server responde HTTP 413 con `code: "PAYLOAD_TOO_LARGE"` y NO procesa el handler del endpoint

### Requirement: Validación tipada de campos numéricos

Los schemas de request SHALL declarar tipos numéricos explícitos (`int`, `float`, `Decimal`, `condecimal`, `conint`) y SHALL rechazar con HTTP 422 valores no numéricos enviados en campos numéricos.

#### Scenario: Valor no numérico en campo entero
- **GIVEN** un schema con `cantidad: int = Field(ge=1)`
- **WHEN** el cliente envía `{"cantidad":"abc"}`
- **THEN** la API responde HTTP 422 con `code: "VALIDATION_ERROR"` y `errors[0].field == "cantidad"`

#### Scenario: Valor numérico válido
- **WHEN** el cliente envía `{"cantidad":3}`
- **THEN** el handler recibe `cantidad=3` como entero
