## ADDED Requirements

### Requirement: Configuración tipada por entorno con `pydantic-settings`

El backend SHALL definir una clase `Settings(BaseSettings)` en `backend/app/core/config.py` que cargue la configuración desde variables de entorno y desde un archivo `.env`, y SHALL validar los tipos al instanciarse. Si una variable obligatoria falta o tiene formato inválido, la aplicación NO SHALL arrancar.

#### Scenario: Variable obligatoria ausente
- **GIVEN** la variable de entorno `SECRET_KEY` no está definida ni en `.env` ni en el entorno
- **WHEN** se intenta importar/instanciar `Settings`
- **THEN** Pydantic lanza un error de validación y `uvicorn` no inicia el servidor

#### Scenario: Variable con tipo inválido
- **GIVEN** `JWT_ACCESS_TOKEN_EXPIRE_MINUTES="abc"` en el entorno
- **WHEN** se instancia `Settings`
- **THEN** Pydantic lanza error de validación indicando que se esperaba un entero

### Requirement: Variables de entorno definidas

`Settings` SHALL exponer al menos los siguientes campos tipados con sus defaults:

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `APP_NAME` | `str` | `"Food Store API"` | |
| `APP_VERSION` | `str` | `"0.1.0"` | |
| `ENV` | `Literal["dev","test","prod"]` | `"dev"` | |
| `DEBUG` | `bool` | `True` en dev, `False` en prod | |
| `DATABASE_URL` | `str \| None` | `None` | opcional en este change; obligatorio en `infra-database` |
| `SECRET_KEY` | `str` | sin default | obligatorio, mínimo 32 caracteres |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `30` | |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `int` | `7` | |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:5173"]` | acepta JSON o CSV |
| `MERCADOPAGO_ACCESS_TOKEN` | `str \| None` | `None` | obligatorio en `prod` |
| `MERCADOPAGO_PUBLIC_KEY` | `str \| None` | `None` | obligatorio en `prod` |
| `RATE_LIMIT_DEFAULT` | `str` | `"60/minute"` | |
| `MAX_BODY_SIZE_BYTES` | `int` | `1_048_576` | 1 MB |

#### Scenario: Carga desde `.env`
- **GIVEN** un archivo `backend/.env` con `SECRET_KEY=...`
- **WHEN** la app arranca
- **THEN** `Settings()` toma esos valores sin necesidad de exportarlos en el shell

#### Scenario: Override por variable de entorno
- **GIVEN** `SECRET_KEY` definida en `.env` y también en el entorno con un valor distinto
- **WHEN** la app arranca
- **THEN** prevalece el valor del entorno sobre el de `.env`

### Requirement: Singleton de Settings vía `get_settings()`

El módulo `core/config.py` SHALL exponer una función `get_settings() -> Settings` decorada con `@lru_cache(maxsize=1)` para que se instancie una única vez por proceso, y SHALL ser usable como dependencia FastAPI vía `Depends(get_settings)` permitiendo overrides en tests con `app.dependency_overrides[get_settings] = ...`.

#### Scenario: Mismo objeto Settings en cada llamada
- **WHEN** se invoca `get_settings()` dos veces seguidas
- **THEN** ambas devoluciones son la misma instancia (`is` equivalente)

#### Scenario: Override en tests
- **GIVEN** un test que necesita un `Settings` con `ENV="test"` y `SECRET_KEY="test-key"`
- **WHEN** el test sobreescribe la dependencia con `app.dependency_overrides[get_settings] = lambda: test_settings`
- **THEN** los handlers reciben el `test_settings` y no el de producción

### Requirement: `.env.example` versionado y documentado

El proyecto SHALL incluir un archivo `backend/.env.example` versionado en git, con TODAS las variables del `Settings` documentadas con un comentario y un valor de ejemplo seguro. El archivo `backend/.env` real NO SHALL estar versionado (debe estar en `.gitignore`).

#### Scenario: Setup inicial de un desarrollador
- **GIVEN** un repositorio recién clonado
- **WHEN** el desarrollador ejecuta `cp backend/.env.example backend/.env`
- **THEN** obtiene un archivo `.env` con todas las variables necesarias y solo debe completar valores reales (`SECRET_KEY` y, cuando llegue `infra-database`, `DATABASE_URL`)

#### Scenario: Documento de ejemplo no expone secretos
- **WHEN** se inspecciona `backend/.env.example`
- **THEN** ningún valor es un secreto real (ej. `SECRET_KEY=changeme-min-32-chars-please-rotate`)

### Requirement: Normalización de `CORS_ORIGINS`

El campo `CORS_ORIGINS` SHALL aceptar tanto un JSON array (`'["http://localhost:5173","http://localhost:3000"]'`) como una lista CSV (`"http://localhost:5173,http://localhost:3000"`) y SHALL normalizarse a `list[str]` antes de pasarse al `CORSMiddleware`.

> **Nota de implementación**: `Settings.CORS_ORIGINS` se declara como `str` para evitar que pydantic-settings v2 intente JSON-decodificar el valor antes de que corran los validadores (comportamiento de la versión 2.x para campos `list[str]`). El valor parseado como `list[str]` se expone vía el `@computed_field` `Settings.cors_origins`, que es el que consume el `CORSMiddleware`.

#### Scenario: Formato JSON
- **GIVEN** `CORS_ORIGINS='["http://localhost:5173"]'`
- **WHEN** se instancia `Settings`
- **THEN** `settings.cors_origins == ["http://localhost:5173"]`

#### Scenario: Formato CSV
- **GIVEN** `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`
- **WHEN** se instancia `Settings`
- **THEN** `settings.cors_origins == ["http://localhost:5173","http://localhost:3000"]`
