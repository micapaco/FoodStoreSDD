## Why

El backend ya tiene su casco operativo (`infra-backend-core`) pero no puede persistir ningún dato: no hay base de datos, no hay modelos, no hay migraciones ni patrones de acceso transaccional. Sin este change, ningún módulo de negocio puede avanzar.

## What Changes

- Agrega `docker-compose.yml` con el servicio PostgreSQL (imagen oficial, volumen persistente, variables de entorno desde `.env`)
- Define todos los modelos SQLModel del ERD v5: identidad, catálogo y ventas/pagos
- Configura Alembic con migración inicial completa que refleja el ERD v5
- Implementa `BaseRepository[T]` genérico y `UnitOfWork` como patrones de acceso transaccional
- Agrega dependencia de sesión async (`get_session`) para inyección en routers
- Agrega seed idempotente con catálogos base (`Rol`, `EstadoPedido`, `FormaPago`) y usuario admin inicial
- Actualiza `backend/.env.example` con `DATABASE_URL` en formato `postgresql+asyncpg://`

## Capabilities

### New Capabilities

- `backend-docker-db`: Servicio PostgreSQL local con Docker Compose, volumen persistente y variables de entorno
- `backend-db-schema`: Modelos SQLModel del ERD v5 + configuración Alembic + migración inicial completa
- `backend-data-access`: `BaseRepository[T]` genérico y `UnitOfWork` como patrones de acceso transaccional, con dependencia de sesión async
- `backend-db-seed`: Script seed idempotente con catálogos base y usuario admin inicial

### Modified Capabilities

- `backend-config`: Agrega `DATABASE_URL` (formato `postgresql+asyncpg://`) como variable de entorno requerida

## Impact

- **Nuevo**: `docker-compose.yml` en raíz del backend
- **Nuevo**: `backend/app/db/` — models, migrations, session, seed
- **Nuevo**: `backend/app/core/repository.py` — `BaseRepository[T]`
- **Nuevo**: `backend/app/core/uow.py` — `UnitOfWork`
- **Modificado**: `backend/.env.example` — agrega `DATABASE_URL`
- **Dependencias Python**: `sqlmodel`, `alembic`, `asyncpg`, `psycopg2-binary` (para alembic CLI sync)
- **Requiere**: Docker Desktop corriendo para levantar PostgreSQL local
