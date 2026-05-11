## Context

Food Store está en **fase pre-apply** y este es el **change 01** del mapa (`docs/CHANGES.md`). No existe todavía ningún módulo de FastAPI funcionando: la carpeta `backend/` tiene solo el scaffolding del repositorio. Las decisiones técnicas que se tomen acá fijan el shape sobre el que se montarán todos los changes posteriores (`infra-database`, `auth`, `catalog-*`, `order-*`, `payment-integration`, etc.), por eso conviene cerrar bien la base antes de seguir.

El stack ya está fijado por `docs/Integrador.txt` y `docs/Descripcion.txt`: FastAPI + SQLModel + PostgreSQL + Alembic + Passlib/bcrypt + slowapi + SDK MercadoPago. Lo que este change resuelve es: **cómo arrancar la app, cómo configurarla, cómo manejar errores de forma consistente, cómo limitar abuso, cómo endurecer inputs y bajo qué prefijo se publican los endpoints**.

Stakeholders:
- **Equipo backend**: necesita un esqueleto donde enchufar los siguientes módulos sin reescribir middleware ni convenciones.
- **Equipo frontend**: necesita un contrato CORS claro y un formato de error uniforme (RFC 7807) para escribir el interceptor de Axios y el manejo global de errores.
- **Sistema**: necesita rate limiting y validación transversal listos antes de exponer endpoints sensibles (login, pagos, webhook IPN).

Restricciones:
- Spec-Driven Development: nada de código antes que specs (lo dice `CLAUDE.md` raíz y `docs/CHANGES.md`).
- No mezclar capas: este change **no toca base de datos** (eso es `infra-database`) ni JWT (eso es `auth`).
- Compatibilidad con la rúbrica: prefijo `/api/v1`, errores RFC 7807, rate limiting `5/15min` en login (preparado, no aplicado todavía), CORS configurable.

## Goals / Non-Goals

**Goals:**
- Tener `uvicorn backend.app.main:app --reload` levantando el servidor en el puerto 8000 sin errores y con `/docs` y `/redoc` accesibles.
- Definir una **única forma** de devolver errores en toda la API (RFC 7807 con `application/problem+json`) y la jerarquía de excepciones de dominio que la sostiene.
- Dejar `slowapi` integrado como middleware, con `Limiter` por IP, sin aplicar todavía decoradores en endpoints (porque aún no hay endpoints de negocio).
- Centralizar la configuración por entorno en un único `Settings` cargado vía `pydantic-settings`, con `.env.example` versionado.
- Exponer el primer router `/api/v1` y un `health` mínimo que **no** dependa de la base de datos.
- Establecer convenciones de validación/sanitización (Pydantic v2 estricto, límite de body size, helpers de saneo) para que cada módulo posterior las aplique sin discusión.

**Non-Goals:**
- No se inicializa SQLAlchemy/SQLModel ni se conecta PostgreSQL (eso es `infra-database`).
- No se implementan migraciones Alembic ni seed.
- No se implementa JWT, login, registro, ni dependencia `get_current_user` (eso es `auth`).
- No se implementan endpoints de catálogo, pedidos, pagos ni admin.
- No se decide deploy ni CI/CD: solo developer experience local.
- No se eligen librerías opinadas de logging estructurado (JSON logs queda como mejora futura); en este change alcanza con `logging` estándar bien configurado.

## Decisions

### D1. App factory en `backend/app/main.py` (vs. archivo monolítico)

Se usa un patrón de **app factory** con función `create_app() -> FastAPI` y la instancia `app = create_app()` exportada para `uvicorn`. Razones:

- Permite tests con instancias aisladas (override de settings) sin reimportar módulos.
- Hace explícito el orden de montaje: settings → middlewares → exception handlers → routers.
- Facilita futuros entornos (`test`, `prod`) sin tocar el archivo principal.

Alternativa descartada: definir `app = FastAPI(...)` directamente a nivel de módulo. Más simple pero estorba para tests y para parametrizar settings.

### D2. Configuración con `pydantic-settings` y `.env`

Se usa `pydantic_settings.BaseSettings` (Pydantic v2) con:

- Carga desde `.env` (no commiteado) y `.env.example` (sí commiteado).
- Campos tipados, con validación temprana al instanciar `Settings()`. Si falta `SECRET_KEY` (mínimo 32 caracteres), la app **no arranca**. `DATABASE_URL` se documenta en `.env.example` pero es opcional en este change (`str | None`, default `None`); su obligatoriedad pasa a `infra-database`.
- `Settings` se expone como singleton vía `@lru_cache` en `get_settings()` para inyectarse como dependencia de FastAPI (`Depends(get_settings)`), permitiendo overrides en tests.
- `CORS_ORIGINS` se acepta como JSON array (`'["http://localhost:5173"]'`) o como CSV, normalizado a `list[str]`.

Alternativas descartadas:
- `python-dotenv` directo + `os.getenv`: pierde la validación tipada. No.
- `dynaconf`: overkill para esta etapa.

### D3. Manejo de errores RFC 7807 con tres handlers

Se registran tres `exception_handler` en `create_app()`:

1. **`AppError`** (excepción base de dominio del proyecto): mapea a un `ProblemDetails` con `status` definido por la subclase. Es el camino feliz para errores controlados.
2. **`RequestValidationError`** (Pydantic): mapea a `422` con `errors: [{ field, message, type }]` siguiendo lo que pide US-068.
3. **`Exception` (catch-all)**: en producción devuelve `500 Internal Server Error` genérico (sin stack trace al cliente); en desarrollo incluye el `detail`. Loguea el stack trace completo en server logs.

`HTTPException` de FastAPI se intercepta también para reformatear su payload al shape RFC 7807, manteniendo `status` y `detail` originales.

Schema base:
```json
{
  "type": "https://foodstore.app/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "Request body failed validation",
  "instance": "/api/v1/pedidos",
  "code": "VALIDATION_ERROR",
  "errors": [{ "field": "items[0].cantidad", "message": "must be >= 1", "type": "value_error" }]
}
```

`Content-Type` de respuesta: `application/problem+json` (lo exige RFC 7807, aunque la mayoría de clientes lo trata igual que JSON).

Alternativa descartada: devolver el shape custom de US-068 (`{ statusCode, message, errors?, timestamp }`) en lugar de RFC 7807. Lo descarté porque tanto `docs/Descripcion.txt` (sección 7) como `docs/Integrador.txt` (sección 5) piden RFC 7807 explícito. El shape de US-068 se cubre como **subset compatible** dentro del problem+json (los campos `errors`, `code`, etc. se agregan como extensiones, RFC 7807 lo permite).

### D4. Jerarquía de excepciones de dominio

```
AppError (status 500 default, code "INTERNAL_ERROR")
├── ValidationAppError       → 422, "VALIDATION_ERROR"
├── UnauthorizedError        → 401, "UNAUTHORIZED"
├── ForbiddenError           → 403, "FORBIDDEN"
├── NotFoundError            → 404, "NOT_FOUND"
├── ConflictError            → 409, "CONFLICT"
└── RateLimitedError         → 429, "RATE_LIMITED"
```

Cada subclase fija `status_code` y `code` por defecto y acepta `detail`/`extensions`. Esto centraliza el mapeo excepción → HTTP en un solo lugar (lo que pide US-068 en notas técnicas).

### D5. Rate limiting con `slowapi`: infraestructura sin límite global activo

- Se instancia `Limiter(key_func=get_remote_address)` **sin `default_limits`** en `core/rate_limit.py` y se expone vía `app.state.limiter = limiter`.
- Se registra `SlowAPIMiddleware` y el handler `_rate_limit_exceeded_handler` para `RateLimitExceeded`, que se reformatea como RFC 7807 con `Retry-After`.
- **No** se impone ningún límite global en este change. Los límites se declaran por endpoint con `@limiter.limit(...)` en los changes que los necesiten (el primero será `auth/login` con `5/15minutes`).
- Dejar `default_limits` vacío o `None` es intencional: evita que endpoints sin decorador fallen con 429 inesperados durante el desarrollo.

Alternativa descartada: implementar un middleware ad-hoc con Redis. `slowapi` es lo que pide la consigna, ya integra con FastAPI y para `dev` el storage en memoria alcanza. Para producción se podría conectar a Redis vía `RATELIMIT_STORAGE_URI`, pero eso queda como Open Question.

### D6. CORS con orígenes parametrizables

`CORSMiddleware` con:
- `allow_origins`: tomado de `Settings.CORS_ORIGINS`. Default en `dev`: `["http://localhost:5173"]`.
- `allow_credentials=True` (necesario para que el frontend mande el header `Authorization` con refresh token cookie en el futuro, si se usara cookies; con localStorage no es estrictamente necesario, pero no estorba).
- `allow_methods=["*"]`, `allow_headers=["*"]` en `dev`. En `prod` se restringen a los efectivamente usados.
- **Nunca** `allow_origins=["*"]` con `allow_credentials=True` (el navegador lo rechaza, y además es inseguro).

### D7. Sanitización/validación transversal

Dos niveles para este change:

1. **Pydantic v2 estricto en schemas**: `model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)` como base reusable en `app/core/schemas.py`. Cada módulo hereda de esta config.
2. **Body size limit**: middleware ligero que rechaza requests con `Content-Length > 1 MB` (configurable). Previene payloads abusivos.

`escape_html` y la regla de no-SQL-concatenado quedan fuera de scope: no hay endpoints ni DB en este change, por lo que no tienen uso concreto todavía. Se incorporarán en el change correspondiente cuando el contexto lo justifique.

### D8. Endpoint `health` sin DB

`GET /api/v1/health` devuelve `{"status": "ok", "service": "foodstore-backend", "version": <Settings.APP_VERSION>}`. **No toca base de datos** porque `infra-database` aún no existe. Cuando exista, se podrá agregar `GET /api/v1/health/db` o un check más rico, pero eso es de otro change.

### D9. Estructura de carpetas

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                       # create_app() + app
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py                 # Settings (BaseSettings) + get_settings()
│   │   ├── errors.py                 # AppError + subclases + handlers + ProblemDetails
│   │   ├── rate_limit.py             # limiter + handler 429
│   │   ├── logging.py                # configuración logging estándar
│   │   └── schemas.py                # BaseSchema con extra=forbid
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py           # router = APIRouter(prefix="/api/v1")
│           └── health.py             # GET /api/v1/health
├── .env.example
├── pyproject.toml                    # o requirements.txt
└── README.md (no se toca acá)
```

### D10. Versionado de la API

Prefijo `/api/v1` global, montado una sola vez. Si en el futuro hace falta `v2`, se agrega un `app/api/v2/` paralelo y se monta con otro prefijo. Lo importante es no romper `v1` una vez publicado.

## Risks / Trade-offs

- **[Riesgo] CORS demasiado permisivo en `dev` se filtra a `prod`** → Mitigación: el `.env.example` documenta explícitamente que `CORS_ORIGINS` debe restringirse en producción al dominio real del frontend, y el `Settings` valida que `CORS_ORIGINS` no esté vacío.

- **[Riesgo] Rate limiter en memoria no sirve para múltiples workers/instancias** → Mitigación: para el TPI alcanza con un solo proceso uvicorn. Documentado en Open Questions: si se hace deploy con replicas, conectar `slowapi` a Redis con `RATELIMIT_STORAGE_URI`.

- **[Riesgo] Cambios futuros en el shape de errores rompen al frontend** → Mitigación: el shape RFC 7807 se documenta en spec con scenarios de test. Cualquier cambio futuro pasa por un nuevo change y delta spec.

- **[Trade-off] `application/problem+json` vs `application/json`** → Algunos clientes ignoran el content-type especial. Mitigación: el cuerpo es JSON válido igual; los clientes que parsean por content-type ven `problem+json`, los que parsean por shape ven el JSON normal. Ambos funcionan.

- **[Trade-off] Validación estricta `extra="forbid"`** → Si el frontend manda un campo extra por error, el request falla con 422. Es lo correcto (failsafe), pero exige coordinación de contrato. Lo asumimos como ganancia de seguridad.

- **[Riesgo] `slowapi` cuenta requests por IP, lo que falla detrás de un proxy/CDN** → Mitigación: si en deploy hay reverse proxy, configurar `key_func` para leer `X-Forwarded-For` confiable. En `dev` no aplica.

## Migration Plan

Como es el **primer change del proyecto**, no hay migración propiamente dicha: solo bootstrap. Pasos para deploy local:

1. Crear `backend/.env` a partir de `backend/.env.example`.
2. `pip install -r backend/requirements.txt` (o `poetry install` desde `backend/`).
3. `uvicorn backend.app.main:app --reload --port 8000`.
4. Verificar `GET http://localhost:8000/api/v1/health` → 200 OK.
5. Verificar `http://localhost:8000/docs` accesible.

Rollback: este change no toca nada externo (no hay BD, no hay deploy). Rollback = `git revert`.

## Open Questions

- **OQ1**: ¿Storage de rate limiter en producción? Por ahora memoria; si hay deploy con replicas hay que decidir Redis vs sticky sessions. Se resolverá en el change que toque deploy/infra de producción.
- **OQ2**: ¿Logging estructurado JSON desde el día 1, o `logging` estándar? Para este change alcanza con `logging` estándar bien configurado. Si se quiere observabilidad (Datadog, Loki) se hace en un change futuro.
- **OQ3**: ¿`SECRET_KEY` queda expuesta solo como variable de entorno, o se considera un gestor de secretos? Para el TPI alcanza `.env`. En producción real iría a un secret manager.
- **OQ4**: ¿El body size limit es 1 MB o más? Definido en 1 MB por defecto en `Settings.MAX_BODY_SIZE_BYTES`, ajustable. Si en el futuro hay subida de imágenes de producto, se sube ese límite específicamente para el endpoint correspondiente.
