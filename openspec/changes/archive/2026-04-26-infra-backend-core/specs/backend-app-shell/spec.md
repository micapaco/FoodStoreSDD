## ADDED Requirements

### Requirement: Application factory de FastAPI

El backend SHALL exponer una función `create_app() -> FastAPI` en `backend/app/main.py` que construya la aplicación FastAPI con su configuración, middlewares, exception handlers y routers, y SHALL exportar `app = create_app()` como instancia ejecutable por `uvicorn`.

#### Scenario: Arranque del servidor en desarrollo
- **WHEN** se ejecuta `uvicorn backend.app.main:app --reload --port 8000`
- **THEN** el servidor inicia sin errores y queda escuchando en `http://localhost:8000`

#### Scenario: Construcción aislada de la app
- **WHEN** un test importa `create_app` y la invoca con un `Settings` overrideado
- **THEN** obtiene una instancia de `FastAPI` independiente, sin estado compartido con otras instancias

### Requirement: Documentación OpenAPI accesible

La aplicación SHALL exponer documentación interactiva en `/docs` (Swagger UI) y `/redoc` (ReDoc), SHALL incluir el título `Food Store API`, SHALL declarar la versión leída desde `Settings.APP_VERSION`, y SHALL listar los endpoints registrados bajo el prefijo `/api/v1`.

#### Scenario: Acceso a Swagger UI
- **WHEN** un cliente hace `GET http://localhost:8000/docs`
- **THEN** recibe HTTP 200 con la UI de Swagger renderizada

#### Scenario: Acceso a ReDoc
- **WHEN** un cliente hace `GET http://localhost:8000/redoc`
- **THEN** recibe HTTP 200 con la UI de ReDoc renderizada

#### Scenario: Schema OpenAPI publicado
- **WHEN** un cliente hace `GET http://localhost:8000/openapi.json`
- **THEN** recibe HTTP 200 con un JSON OpenAPI 3.x válido que incluye al menos el endpoint `/api/v1/health`

### Requirement: Router raíz `/api/v1`

La aplicación SHALL montar un único router raíz con prefijo `/api/v1` al que se irán enchufando los routers feature-first en changes posteriores. NO SHALL exponer endpoints de negocio fuera de ese prefijo (excepto `/docs`, `/redoc`, `/openapi.json` propios de FastAPI).

#### Scenario: Endpoint registrado fuera de prefijo
- **WHEN** un desarrollador intenta agregar un endpoint en `/usuarios` sin el prefijo `/api/v1`
- **THEN** la convención del proyecto exige que el endpoint se registre bajo `/api/v1/usuarios` y la review lo rechaza si no cumple

#### Scenario: Listado de endpoints registrados
- **WHEN** se inspecciona `app.routes`
- **THEN** todos los endpoints de negocio aparecen con el prefijo `/api/v1`

### Requirement: Endpoint de health check sin dependencia de base de datos

La aplicación SHALL exponer `GET /api/v1/health` que responde HTTP 200 con un JSON `{ "status": "ok", "service": "foodstore-backend", "version": <APP_VERSION> }` y NO SHALL ejecutar consultas a la base de datos.

#### Scenario: Health check exitoso
- **WHEN** un cliente hace `GET /api/v1/health`
- **THEN** recibe HTTP 200 con el body `{"status":"ok","service":"foodstore-backend","version":"<X.Y.Z>"}`

#### Scenario: Health check disponible sin BD
- **GIVEN** la base de datos no está configurada todavía (estado actual del proyecto)
- **WHEN** un cliente hace `GET /api/v1/health`
- **THEN** recibe HTTP 200 sin que el backend intente conectarse a PostgreSQL

### Requirement: Ciclo de vida explícito de la aplicación

La aplicación SHALL definir hooks `startup` y `shutdown` (vía `lifespan` context manager de FastAPI) en `create_app()` que dejen registrado en logs el inicio y el cierre del servicio.

#### Scenario: Log de arranque
- **WHEN** la aplicación inicia
- **THEN** se emite un log INFO con el mensaje `"Food Store backend started"` y la versión de la app

#### Scenario: Log de cierre
- **WHEN** la aplicación recibe SIGTERM o SIGINT
- **THEN** se emite un log INFO con el mensaje `"Food Store backend shutting down"` antes de finalizar el proceso
