## ADDED Requirements

### Requirement: CORS configurado con orígenes parametrizables

La aplicación SHALL registrar `fastapi.middleware.cors.CORSMiddleware` durante `create_app()` con `allow_origins` tomado de `Settings.CORS_ORIGINS`, y SHALL permitir el origen `http://localhost:5173` por defecto en desarrollo.

#### Scenario: Origen permitido en dev
- **GIVEN** `Settings.CORS_ORIGINS == ["http://localhost:5173"]`
- **WHEN** el frontend hace una request preflight `OPTIONS /api/v1/health` con `Origin: http://localhost:5173`
- **THEN** la respuesta incluye `Access-Control-Allow-Origin: http://localhost:5173` y HTTP 200

#### Scenario: Origen no permitido
- **GIVEN** `Settings.CORS_ORIGINS == ["http://localhost:5173"]`
- **WHEN** un cliente hace una request desde `Origin: http://malicious.com`
- **THEN** la respuesta NO incluye `Access-Control-Allow-Origin: http://malicious.com` y el navegador del cliente bloquea la lectura del response

### Requirement: Métodos y headers permitidos

El middleware CORS SHALL permitir los métodos HTTP `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` y SHALL permitir los headers necesarios para autenticación (`Authorization`, `Content-Type`).

#### Scenario: Preflight con header Authorization
- **WHEN** el frontend hace `OPTIONS` con `Access-Control-Request-Headers: authorization, content-type`
- **THEN** la respuesta incluye `Access-Control-Allow-Headers: authorization, content-type` y HTTP 200

#### Scenario: Método permitido
- **WHEN** el frontend hace `Access-Control-Request-Method: POST` en un preflight
- **THEN** la respuesta incluye `Access-Control-Allow-Methods` con `POST` listado

### Requirement: Credenciales en CORS

El middleware CORS SHALL configurar `allow_credentials=True` y NO SHALL combinar `allow_credentials=True` con `allow_origins=["*"]`.

#### Scenario: Wildcard rechazado con credentials
- **GIVEN** un intento de configurar `Settings.CORS_ORIGINS=["*"]` con `allow_credentials=True`
- **WHEN** la app arranca
- **THEN** o bien `Settings` rechaza el wildcard, o bien `create_app()` falla con un error claro indicando la combinación insegura

#### Scenario: Credenciales aceptadas con origen explícito
- **GIVEN** `Settings.CORS_ORIGINS=["http://localhost:5173"]`
- **WHEN** el frontend manda una request con `credentials: "include"` desde `http://localhost:5173`
- **THEN** la respuesta incluye `Access-Control-Allow-Credentials: true`

### Requirement: Validación de configuración CORS no vacía

`Settings` SHALL rechazar una configuración con `CORS_ORIGINS` vacío para evitar que la app arranque sin posibilidad de recibir requests del frontend.

#### Scenario: CORS_ORIGINS vacío
- **GIVEN** `CORS_ORIGINS=[]`
- **WHEN** se instancia `Settings`
- **THEN** Pydantic lanza error de validación con mensaje claro indicando que se necesita al menos un origen
