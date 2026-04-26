## ADDED Requirements

### Requirement: Integración global de `slowapi`

La aplicación SHALL instanciar un `Limiter` de `slowapi` en `backend/app/core/rate_limit.py` usando `slowapi.util.get_remote_address` como `key_func` por defecto, SHALL exponerlo vía `app.state.limiter = limiter`, y SHALL registrar el `SlowAPIMiddleware` durante `create_app()`.

#### Scenario: Limiter accesible desde la app
- **WHEN** se inspecciona `app.state.limiter`
- **THEN** se obtiene una instancia de `slowapi.Limiter`

#### Scenario: Middleware registrado
- **WHEN** se listan los middlewares de la app
- **THEN** `SlowAPIMiddleware` está presente

### Requirement: Respuesta 429 en formato RFC 7807 con `Retry-After`

Cuando un cliente excede un rate limit declarado en un endpoint, la API SHALL responder HTTP 429 (`Too Many Requests`) con un body en formato `application/problem+json` (`code: "RATE_LIMITED"`, `title: "Too Many Requests"`) y SHALL incluir el header `Retry-After` con la cantidad de segundos a esperar.

#### Scenario: Excedido un límite declarado
- **GIVEN** un endpoint `POST /api/v1/<endpoint>` decorado con `@limiter.limit("5/15minutes")`
- **WHEN** el mismo IP hace 6 requests dentro de la ventana de 15 minutos
- **THEN** la 6ta request recibe HTTP 429 con `Content-Type: application/problem+json`, body con `code: "RATE_LIMITED"` y header `Retry-After: <segundos>` con un valor entero positivo

#### Scenario: Bajo el límite no afecta
- **GIVEN** un endpoint `@limiter.limit("5/15minutes")`
- **WHEN** un IP hace 4 requests dentro de la ventana
- **THEN** todas las requests pasan al handler normalmente sin 429

### Requirement: Rate limit configurable por defecto

`Settings.RATE_LIMIT_DEFAULT` SHALL ser un string parseable por `slowapi` (ej. `"60/minute"`) que define el límite por defecto a aplicar globalmente cuando un endpoint no declara su propio límite. La aplicación SHALL aplicar este default a todos los endpoints excepto cuando el endpoint declare uno específico.

#### Scenario: Default global aplicado
- **GIVEN** `Settings.RATE_LIMIT_DEFAULT == "60/minute"` y un endpoint sin decorador específico
- **WHEN** un IP hace 61 requests al endpoint dentro de un minuto
- **THEN** la 61ra request recibe HTTP 429

#### Scenario: Decorador específico anula el default
- **GIVEN** un endpoint decorado con `@limiter.limit("5/15minutes")`
- **WHEN** un IP hace 6 requests en 15 minutos
- **THEN** se aplica el límite específico (5) y NO el default global (60)

### Requirement: Preparado para el límite de login en `auth`

La integración SHALL permitir que el módulo `auth` (change posterior) declare `@limiter.limit("5/15minutes")` sobre el endpoint `POST /api/v1/auth/login` sin requerir cambios adicionales en `core/rate_limit.py` ni en `main.py`.

#### Scenario: Decorador disponible
- **GIVEN** este change ya aplicado y el módulo `auth` siendo construido en un change futuro
- **WHEN** el desarrollador agrega `@limiter.limit("5/15minutes")` al router de login
- **THEN** el límite funciona inmediatamente sin necesidad de modificar el bootstrap del backend

### Requirement: Storage de rate limiter por entorno

El `Limiter` SHALL usar storage en memoria por defecto en `dev` y `test`. La configuración SHALL permitir overridear el storage vía `Settings.RATE_LIMIT_STORAGE_URI` (ej. `"redis://localhost:6379"`) sin cambiar código, anticipando deploys multi-instancia.

#### Scenario: Storage en memoria por defecto
- **GIVEN** `Settings.RATE_LIMIT_STORAGE_URI` no definido
- **WHEN** la app arranca
- **THEN** el `Limiter` usa `memory://` como storage

#### Scenario: Override a Redis
- **GIVEN** `Settings.RATE_LIMIT_STORAGE_URI="redis://localhost:6379"`
- **WHEN** la app arranca
- **THEN** el `Limiter` se configura para usar ese URI como backend de storage
