## MODIFIED Requirements

### Requirement: Variables de entorno definidas

`Settings` SHALL exponer al menos los siguientes campos tipados con sus defaults:

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `APP_NAME` | `str` | `"Food Store API"` | |
| `APP_VERSION` | `str` | `"0.1.0"` | |
| `ENV` | `Literal["dev","test","prod"]` | `"dev"` | |
| `DEBUG` | `bool` | `True` en dev, `False` en prod | |
| `DATABASE_URL` | `str` | sin default | obligatorio desde `infra-database` |
| `SECRET_KEY` | `str` | sin default | obligatorio, mínimo 32 caracteres |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `int` | `30` | |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | `int` | `7` | |
| `CORS_ORIGINS` | `list[str]` | `["http://localhost:5173"]` | acepta JSON o CSV |
| `MERCADOPAGO_ACCESS_TOKEN` | `str \| None` | `None` | obligatorio en `prod` |
| `MERCADOPAGO_PUBLIC_KEY` | `str \| None` | `None` | obligatorio en `prod` |
| `RATE_LIMIT_DEFAULT` | `str` | `"60/minute"` | |
| `MAX_BODY_SIZE_BYTES` | `int` | `1_048_576` | 1 MB |
| `POSTGRES_USER` | `str` | sin default | usado por docker-compose |
| `POSTGRES_PASSWORD` | `str` | sin default | usado por docker-compose |
| `POSTGRES_DB` | `str` | sin default | usado por docker-compose |
| `POSTGRES_PORT` | `int` | `5432` | usado por docker-compose |

#### Scenario: DATABASE_URL ausente impide arranque

- **GIVEN** el archivo `.env` no define `DATABASE_URL`
- **WHEN** se intenta importar/instanciar `Settings`
- **THEN** Pydantic lanza un error de validación y la aplicación NO arranca

#### Scenario: DATABASE_URL con formato asyncpg aceptado

- **GIVEN** `DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/foodstore_db`
- **WHEN** se instancia `Settings`
- **THEN** `settings.DATABASE_URL` contiene exactamente ese valor, sin modificación
