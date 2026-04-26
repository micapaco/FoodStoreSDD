## Why

Food Store no tiene todavía un backend ejecutable: no hay aplicación FastAPI inicializada, ni configuración por entorno, ni middleware transversal de errores, CORS, rate limiting o validación. Sin esa base operativa, ninguna otra capability del sistema (auth, catálogo, pedidos, pagos) puede empezar a construirse, porque no existe un proceso HTTP donde montarla. Este change levanta el esqueleto ejecutable mínimo del backend para que el resto del proyecto tenga dónde apoyarse.

## What Changes

- Inicializar la aplicación FastAPI en `backend/app/main.py` con startup/shutdown explícitos y documentación OpenAPI accesible en `/docs` y `/redoc`.
- Agregar carga de configuración por entorno mediante `pydantic-settings`/`BaseSettings` en `backend/app/core/config.py`, leyendo variables desde `.env` (`DATABASE_URL`, `SECRET_KEY`, `JWT_*`, `CORS_ORIGINS`, `MERCADOPAGO_*`, etc.) con valores por defecto seguros y un `.env.example` documentado.
- Configurar `CORSMiddleware` con orígenes parametrizables por entorno (incluyendo `http://localhost:5173` en desarrollo).
- Implementar manejo global de errores siguiendo **RFC 7807 (Problem Details for HTTP APIs)**: handler para `HTTPException`, `RequestValidationError` y `Exception` no controlada, con un schema Pydantic `ProblemDetails` y mapeo consistente a `application/problem+json`.
- Definir excepciones de dominio reutilizables (`AppError`, `ValidationAppError`, `NotFoundError`, `ForbiddenError`, `UnauthorizedError`, `ConflictError`) y mapearlas a status HTTP en un único punto.
- Integrar **rate limiting con `slowapi`**: `Limiter` global por IP, registro del middleware y el handler `429 Too Many Requests` con cabecera `Retry-After`. Queda preparado para que `auth/login` aplique `5/15 minutes` cuando ese módulo se construya.
- Establecer validación transversal base: configuración de Pydantic v2 (`extra="forbid"`, `str_strip_whitespace`) como política reusable para todos los schemas del proyecto, y middleware que rechaza payloads que superen el límite de tamaño configurado.
- Registrar un **router raíz `/api/v1`** vacío al que se irán enchufando los routers feature-first (`auth`, `productos`, `pedidos`, etc.) en changes posteriores.
- Crear un endpoint `GET /api/v1/health` mínimo que devuelve `{ "status": "ok" }` para poder verificar el arranque sin depender de la base de datos.
- Definir la estructura inicial de `backend/app/core/` (`config.py`, `errors.py`, `rate_limit.py`, `logging.py`) y `backend/app/api/v1/__init__.py`, sin tocar todavía `database.py` ni `security.py` (eso pertenece a `infra-database` y `auth`).

> No se incluye en este change: modelos SQLModel, conexión a PostgreSQL, Alembic, seed, JWT, login, ni ningún módulo funcional. Esos cubren `infra-database`, `auth` y los siguientes changes del mapa.

## Capabilities

### New Capabilities

- `backend-app-shell`: Application factory de FastAPI, ciclo de vida (startup/shutdown), montaje del router `/api/v1`, exposición de OpenAPI/Swagger/ReDoc, endpoint `health`.
- `backend-config`: Carga de configuración por entorno con `BaseSettings`, `.env`/`.env.example`, separación de perfiles (`dev`/`prod`/`test`) y validación temprana de variables obligatorias.
- `backend-cors`: Configuración de `CORSMiddleware` con orígenes permitidos parametrizables, métodos y headers controlados.
- `backend-error-handling`: Manejo global de errores en formato RFC 7807, jerarquía de excepciones de dominio, mapeo único de excepciones a códigos HTTP, logging seguro de errores 5xx sin exponer stack traces al cliente.
- `backend-rate-limiting`: Infraestructura de rate limiting con `slowapi`: `Limiter` por IP, middleware y handler 429 con `Retry-After` registrados. Sin límite global activo en este change; los límites concretos se declaran por endpoint en changes posteriores (empezando por `auth/login`).
- `backend-input-hardening`: Política base de validación de inputs: `BaseSchema` con `extra="forbid"` y `str_strip_whitespace`, límite de tamaño de payload (413). Helpers de saneo y reglas de SQL quedan fuera de scope hasta que haya endpoints y DB concretos.

### Modified Capabilities

<!-- Ninguna: el repositorio no tiene specs previas en `openspec/specs/`. Este es el primer change del proyecto. -->

## Impact

- **Código nuevo**: árbol `backend/app/`, en particular `backend/app/main.py`, `backend/app/core/{config,errors,rate_limit,logging}.py`, `backend/app/api/v1/__init__.py`, `backend/app/api/v1/health.py`.
- **Configuración**: nuevo `backend/.env.example`, `backend/pyproject.toml` o `backend/requirements.txt` con dependencias core (`fastapi`, `uvicorn[standard]`, `pydantic`, `pydantic-settings`, `slowapi`, `python-multipart`, `email-validator`). Las dependencias de auth (`python-jose[cryptography]`, `passlib[bcrypt]`) pertenecen al change `auth`.
- **APIs**: se publica el contrato base `/api/v1/health` y la convención de errores RFC 7807. Se reserva el prefijo `/api/v1` para todos los endpoints futuros.
- **Dependencias**: introduce stack base de FastAPI (sin tocar SQLModel/Alembic todavía).
- **Sistemas afectados**: define el contrato CORS que el frontend (`infra-frontend-core`) deberá respetar y el formato de error que el frontend deberá interpretar de forma uniforme.
- **No impacta**: base de datos, modelos, autenticación real, lógica de negocio. Esos quedan como dependencias hacia adelante.
- **Riesgos**: si la configuración de CORS o de rate limiting queda mal calibrada, bloqueará el desarrollo local del frontend o provocará 429 espurios. Se mitiga con valores por defecto pensados para `dev` y override por `.env` en `prod`.
