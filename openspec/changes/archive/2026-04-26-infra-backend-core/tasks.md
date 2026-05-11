## 1. Bootstrap del proyecto backend

- [x] 1.1 Crear estructura de carpetas: `backend/app/`, `backend/app/core/`, `backend/app/api/v1/` con sus respectivos `__init__.py`.
- [x] 1.2 Definir `backend/pyproject.toml` (o `requirements.txt`) con dependencias core: `fastapi`, `uvicorn[standard]`, `pydantic>=2`, `pydantic-settings`, `slowapi`, `python-multipart`, `email-validator`. Fijar versiones compatibles con FastAPI 0.111+. Las dependencias de auth (`python-jose[cryptography]`, `passlib[bcrypt]`) se agregan en el change `auth`.
- [x] 1.3 Crear `backend/.gitignore` (si no está) excluyendo `.env`, `__pycache__/`, `.venv/`, `*.pyc`, `dist/`.
- [x] 1.4 Crear `backend/.env.example` versionado con TODAS las variables del `Settings` documentadas con comentarios y valores de ejemplo seguros (sin secretos reales).

## 2. Configuración tipada (`backend-config`)

- [x] 2.1 Implementar `backend/app/core/config.py` con `class Settings(BaseSettings)` y los campos definidos en la spec (APP_NAME, APP_VERSION, ENV, DEBUG, DATABASE_URL, SECRET_KEY, JWT_*, CORS_ORIGINS, MERCADOPAGO_*, RATE_LIMIT_DEFAULT, RATE_LIMIT_STORAGE_URI, MAX_BODY_SIZE_BYTES).
- [x] 2.2 Configurar `model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)`.
- [x] 2.3 Implementar validador `@field_validator("CORS_ORIGINS", mode="before")` que acepte JSON array o CSV y normalice a `list[str]`.
- [x] 2.4 Implementar validador que rechace `CORS_ORIGINS=[]` con mensaje claro.
- [x] 2.5 Validar `len(SECRET_KEY) >= 32` con `field_validator`.
- [x] 2.6 Exponer `get_settings()` decorado con `@lru_cache(maxsize=1)`.
- [x] 2.7 Verificar manualmente que con `.env` mínimo (`SECRET_KEY`) la app instancia `Settings` sin error, y sin `SECRET_KEY` falla con error claro. `DATABASE_URL` puede estar ausente o ser `None` sin que la app falle en este change.

## 3. Errores RFC 7807 (`backend-error-handling`)

- [x] 3.1 Implementar `backend/app/core/errors.py`:
  - [x] 3.1.1 Schema Pydantic `ProblemDetails` con campos `type`, `title`, `status`, `detail`, `instance`, `code`, `errors?`, `extensions?`.
  - [x] 3.1.2 Clase base `AppError(Exception)` con `status_code=500`, `code="INTERNAL_ERROR"`, `detail`, `extensions`.
  - [x] 3.1.3 Subclases `ValidationAppError` (422), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `RateLimitedError` (429).
- [x] 3.2 Implementar handlers en el mismo módulo:
  - [x] 3.2.1 `app_error_handler(request, exc: AppError)` → respuesta `application/problem+json` con shape correcto.
  - [x] 3.2.2 `validation_error_handler(request, exc: RequestValidationError)` → 422 con `errors: [{field, message, type}]` y `code: "VALIDATION_ERROR"`. El `field` debe reflejar paths anidados (`"items[0].cantidad"`).
  - [x] 3.2.3 `http_exception_handler(request, exc: HTTPException)` → reformatear a problem+json preservando `status_code` y `detail`.
  - [x] 3.2.4 `unhandled_exception_handler(request, exc: Exception)` → loguea stack trace con nivel ERROR; en `prod` devuelve body genérico, en `dev` incluye `detail` con el tipo de excepción.
- [x] 3.3 Implementar función `register_exception_handlers(app: FastAPI, settings: Settings)` que registra los cuatro handlers en orden correcto.
- [x] 3.4 Asegurar que todas las respuestas de error tienen `Content-Type: application/problem+json`.

## 4. Logging (`logging.py`)

- [x] 4.1 Implementar `backend/app/core/logging.py` con `configure_logging(settings: Settings)` que setee nivel `INFO` en `dev` y `WARNING` en `prod`, formato `%(asctime)s [%(levelname)s] %(name)s: %(message)s`.
- [x] 4.2 Asegurar que el logger del unhandled handler logueea `request.method`, `request.url.path` y `traceback` completo.

## 5. Rate limiting (`backend-rate-limiting`)

- [x] 5.1 Implementar `backend/app/core/rate_limit.py`:
  - [x] 5.1.1 Crear `Limiter(key_func=get_remote_address)` **sin `default_limits`**: no se impone ningún límite global en este change. Los límites se declaran por endpoint con `@limiter.limit(...)` en changes posteriores.
  - [x] 5.1.2 Exponer `limiter` como módulo-level singleton (importable desde otros módulos para que apliquen `@limiter.limit(...)`).
- [x] 5.2 Implementar `rate_limit_exceeded_handler(request, exc: RateLimitExceeded)` que devuelva problem+json con `code: "RATE_LIMITED"`, status 429 y header `Retry-After` en segundos.
- [x] 5.3 En `create_app()`: setear `app.state.limiter = limiter`, registrar `SlowAPIMiddleware`, registrar el handler de `RateLimitExceeded`.
- [x] 5.4 Confirmar que un endpoint de prueba con `@limiter.limit("2/minute")` activa el 429 en la 3er request en menos de 60s. (Test manual con curl o test automatizado opcional).

## 6. Sanitización transversal (`backend-input-hardening`)

- [x] 6.1 Implementar `backend/app/core/schemas.py` con `class BaseSchema(BaseModel)` y `model_config = ConfigDict(extra="forbid", str_strip_whitespace=True, populate_by_name=True)`.
- [x] 6.2 Implementar middleware `BodySizeLimitMiddleware` (ASGI middleware o `BaseHTTPMiddleware`) que lea `Content-Length` del request y rechace con 413 cuando supere `settings.MAX_BODY_SIZE_BYTES`. Devolver problem+json con `code: "PAYLOAD_TOO_LARGE"`.

## 7. CORS (`backend-cors`)

- [x] 7.1 En `create_app()` registrar `CORSMiddleware` con:
  - `allow_origins=settings.CORS_ORIGINS`
  - `allow_credentials=True`
  - `allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"]`
  - `allow_headers=["Authorization","Content-Type","Accept","Origin","X-Requested-With"]`
- [x] 7.2 Documentar en `.env.example` que `CORS_ORIGINS` debe restringirse al dominio real en `prod`.
- [x] 7.3 Verificar manualmente con `curl -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: GET" http://localhost:8000/api/v1/health` que el preflight devuelve 200 con los headers `Access-Control-Allow-*` correctos.

## 8. App shell y router raíz (`backend-app-shell`)

- [x] 8.1 Implementar `backend/app/api/v1/__init__.py` con `router = APIRouter(prefix="/api/v1")` y un comentario explicando que es el lugar único donde se incluyen los routers feature en changes posteriores.
- [x] 8.2 Implementar `backend/app/api/v1/health.py` con `GET /health` (que termina siendo `GET /api/v1/health`) que devuelve `{"status":"ok","service":"foodstore-backend","version": settings.APP_VERSION}`. NO debe ejecutar consultas a BD.
- [x] 8.3 Incluir el router de health en el router raíz `/api/v1`.
- [x] 8.4 Implementar `backend/app/main.py`:
  - [x] 8.4.1 Definir `lifespan` async context manager que loguea startup/shutdown.
  - [x] 8.4.2 Implementar `def create_app() -> FastAPI` que: instancia `Settings`, configura logging, crea `FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION, lifespan=lifespan)`, registra middlewares (CORS, body size, slowapi) en orden correcto, registra exception handlers, monta el router `/api/v1`.
  - [x] 8.4.3 Exportar `app = create_app()` a nivel de módulo.
- [x] 8.5 Verificar manualmente: `uvicorn backend.app.main:app --reload --port 8000` arranca, `GET /api/v1/health` → 200, `GET /docs` → UI, `GET /redoc` → UI, `GET /openapi.json` → JSON válido que incluye `/api/v1/health`.

## 9. Smoke tests manuales y documentación mínima

- [x] 9.1 Ejecutar `curl http://localhost:8000/api/v1/health` y validar shape del response.
- [x] 9.2 Ejecutar `curl -X POST http://localhost:8000/api/v1/health` y validar que devuelve 405 con shape RFC 7807 (`code: "METHOD_NOT_ALLOWED"` o equivalente derivado del HTTPException handler).
- [x] 9.3 Ejecutar `curl http://localhost:8000/api/v1/no-existe` y validar que devuelve 404 con shape RFC 7807.
- [x] 9.4 Confirmar que el `.env.example` está completo y que `cp .env.example .env && uvicorn ...` funciona en una máquina nueva.
- [x] 9.5 Agregar un comentario o sección breve al `backend/README.md` (si existe) o crearlo con instrucciones mínimas: setup `.env`, instalar deps, levantar servidor, links a `/docs` y `/health`. (Solo si el repo lo pide; este change no obliga a documentación extensa).

## 10. Verificación final contra specs

- [x] 10.1 Recorrer cada scenario de `specs/backend-app-shell/spec.md` y validar manualmente o con tests.
- [x] 10.2 Recorrer cada scenario de `specs/backend-config/spec.md`.
- [x] 10.3 Recorrer cada scenario de `specs/backend-cors/spec.md`.
- [x] 10.4 Recorrer cada scenario de `specs/backend-error-handling/spec.md`.
- [x] 10.5 Recorrer cada scenario de `specs/backend-rate-limiting/spec.md`.
- [x] 10.6 Recorrer cada scenario de `specs/backend-input-hardening/spec.md`.
- [x] 10.7 Ejecutar `openspec validate infra-backend-core` y confirmar que sale OK.
- [x] 10.8 Confirmar que NINGUNA tarea de este change toca base de datos, JWT real, modelos SQLModel ni endpoints de negocio (eso pertenece a `infra-database` y `auth`).
