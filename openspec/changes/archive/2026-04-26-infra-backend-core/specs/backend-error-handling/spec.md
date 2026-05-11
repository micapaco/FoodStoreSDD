## ADDED Requirements

### Requirement: Formato de error RFC 7807 (Problem Details)

Todas las respuestas de error de la API SHALL seguir el formato definido en RFC 7807 (`application/problem+json`) con el siguiente shape mínimo:

```json
{
  "type": "<URI identificando el tipo de error>",
  "title": "<resumen humano-legible>",
  "status": <int HTTP status>,
  "detail": "<descripción específica de esta ocurrencia>",
  "instance": "<path de la request>",
  "code": "<código semántico estable, MAYÚSCULAS_SNAKE_CASE>"
}
```

El header `Content-Type` de la respuesta SHALL ser `application/problem+json`.

#### Scenario: Error 404 estándar
- **WHEN** un cliente hace `GET /api/v1/recurso-inexistente`
- **THEN** recibe HTTP 404 con `Content-Type: application/problem+json` y body con campos `type`, `title`, `status: 404`, `detail`, `instance: "/api/v1/recurso-inexistente"`, `code: "NOT_FOUND"`

#### Scenario: No se exponen stack traces
- **GIVEN** `Settings.ENV == "prod"`
- **WHEN** una excepción no controlada se eleva en un handler
- **THEN** el response es HTTP 500 con un body genérico (`title: "Internal Server Error"`, `detail: "An unexpected error occurred"`) sin stack trace, traceback ni detalles de implementación

### Requirement: Errores de validación con detalle por campo

Los errores de validación de Pydantic SHALL devolverse con HTTP 422 e incluir un campo extra `errors` que sea una lista de objetos `{ "field": "<path.del.campo>", "message": "<mensaje>", "type": "<tipo de error>" }`.

#### Scenario: Body inválido
- **WHEN** un cliente envía `POST /api/v1/<endpoint>` con body que falla validación Pydantic en dos campos
- **THEN** recibe HTTP 422 con `code: "VALIDATION_ERROR"` y `errors` con dos objetos describiendo cada campo en formato `{field, message, type}`

#### Scenario: Path de campo anidado
- **WHEN** falla la validación en un campo anidado (ej. `items[0].cantidad`)
- **THEN** el campo `field` del error refleja el path completo separado por puntos y corchetes (ej. `"items[0].cantidad"`)

### Requirement: Jerarquía de excepciones de dominio

El módulo `backend/app/core/errors.py` SHALL definir una clase base `AppError` y subclases tipadas que mapean a status HTTP específicos:

- `AppError` → 500, code `INTERNAL_ERROR`
- `ValidationAppError` → 422, code `VALIDATION_ERROR`
- `UnauthorizedError` → 401, code `UNAUTHORIZED`
- `ForbiddenError` → 403, code `FORBIDDEN`
- `NotFoundError` → 404, code `NOT_FOUND`
- `ConflictError` → 409, code `CONFLICT`
- `RateLimitedError` → 429, code `RATE_LIMITED`

Cada subclase SHALL aceptar un `detail: str` y opcionalmente `extensions: dict[str, Any]` que se serializan dentro del cuerpo del problem+json.

#### Scenario: Lanzar NotFoundError desde un service
- **GIVEN** un service que no encuentra un recurso solicitado
- **WHEN** lanza `raise NotFoundError("Producto 42 no existe")`
- **THEN** el cliente recibe HTTP 404 con `code: "NOT_FOUND"`, `detail: "Producto 42 no existe"`

#### Scenario: ConflictError con extensiones
- **WHEN** un service lanza `raise ConflictError("Email ya registrado", extensions={"field": "email"})`
- **THEN** el cliente recibe HTTP 409 con `code: "CONFLICT"` y el campo `field: "email"` presente en el cuerpo del problem+json

### Requirement: Mapeo único de excepciones a HTTP

El registro de exception handlers SHALL ocurrir en un único lugar (`create_app()` invocando una función `register_exception_handlers(app)` definida en `core/errors.py`). Los handlers SHALL cubrir como mínimo: `AppError`, `RequestValidationError` (Pydantic), `HTTPException` (FastAPI) y `Exception` (catch-all).

#### Scenario: HTTPException reformateada
- **WHEN** un dependency lanza `HTTPException(status_code=403, detail="Acceso denegado")`
- **THEN** el cliente recibe HTTP 403 con un body en formato problem+json (no el body por defecto de FastAPI `{"detail": "..."}`)

#### Scenario: Exception no controlada
- **GIVEN** `Settings.ENV == "prod"`
- **WHEN** un handler lanza una excepción no esperada
- **THEN** el cliente recibe HTTP 500 con problem+json genérico, y el servidor loguea el stack trace completo en nivel `ERROR`

### Requirement: Logging seguro de errores 5xx

Para errores con `status >= 500`, el handler SHALL loguear el stack trace completo en server-side con nivel `ERROR` (incluyendo `request.method`, `request.url.path`, exception `__class__.__name__`), pero NO SHALL incluir el stack trace en la respuesta HTTP devuelta al cliente cuando `Settings.ENV == "prod"`.

#### Scenario: Logging server-side
- **WHEN** se eleva una `Exception` no controlada
- **THEN** los server logs incluyen una línea `ERROR` con el método, path y traceback completo

#### Scenario: Modo dev incluye detail
- **GIVEN** `Settings.ENV == "dev"`
- **WHEN** se eleva una `Exception` no controlada
- **THEN** el cliente recibe HTTP 500 con `detail` que describe el tipo de excepción para facilitar debugging local
