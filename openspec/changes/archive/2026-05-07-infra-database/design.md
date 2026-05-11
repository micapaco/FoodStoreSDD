## Context

El backend (change 01) arranca pero no tiene persistencia. Este change agrega la capa de base de datos completa: infraestructura Docker, modelos SQLModel del ERD v5, migraciones Alembic, patrones de acceso transaccional (`BaseRepository[T]` + `UnitOfWork`) y seed idempotente. Todo módulo de negocio futuro depende de esta base.

**Estado actual**: `backend/app/core/config.py` tiene `DATABASE_URL` como `Optional[str]` (sin default útil). No existe `docker-compose.yml`, no hay modelos, no hay migraciones.

## Goals / Non-Goals

**Goals:**
- PostgreSQL local levantable con `docker compose up -d`
- Modelos SQLModel que reflejan fielmente el ERD v5 (todas las tablas, tipos, constraints)
- Migración inicial Alembic que crea el schema completo
- `BaseRepository[T]` genérico reutilizable por todos los módulos
- `UnitOfWork` que garantiza atomicidad sin `session.commit()` disperso en servicios
- Seed idempotente que deja el sistema en estado mínimo operativo

**Non-Goals:**
- Lógica de negocio (eso pertenece a cada módulo)
- Autenticación/JWT (change 05)
- Repositorios específicos por módulo (cada change los crea en su propio módulo)
- Tests de integración contra BD (se añaden cuando cada módulo los requiera)

## Decisions

### 1. SQLModel sobre SQLAlchemy puro

**Elección**: SQLModel.  
**Rationale**: SQLModel unifica el modelo Pydantic (validación, serialización) y el modelo ORM (tabla, relaciones) en una sola clase. Evita duplicar schemas y reduce boilerplate. El proyecto ya usa Pydantic v2 en FastAPI; SQLModel es compatible.  
**Alternativa descartada**: SQLAlchemy Core + Pydantic por separado — doble definición de cada entidad, más superficie de error.

### 2. Driver async: `asyncpg`

**Elección**: `asyncpg` como driver (URL `postgresql+asyncpg://`).  
**Rationale**: FastAPI es async-native. Usar driver sync introduce bloqueo del event loop bajo carga. `asyncpg` es el driver más maduro y performante para PostgreSQL async en Python.  
**Nota**: Alembic usa migrations síncronas; se agrega `psycopg2-binary` solo para el entorno de CLI de Alembic (no en runtime).

### 3. Alembic con `autogenerate` controlado

**Elección**: Alembic con `env.py` que importa todos los modelos SQLModel y llama a `target_metadata = SQLModel.metadata`.  
**Rationale**: `autogenerate` detecta diferencias entre modelos y schema real — reduce errores manuales. Las migraciones se revisan antes de aplicar, nunca se aplican automáticamente en producción.  
**Convención**: Un único archivo de migración inicial (`0001_initial.py`). Cada change futuro que agregue tablas genera su propia migración.

### 4. `BaseRepository[T]` genérico en `core/`

**Elección**: Clase genérica `BaseRepository[T: SQLModel]` en `backend/app/core/repository.py`.  
**Rationale**: Centraliza las operaciones CRUD comunes. Cada módulo hereda y agrega queries específicas. Evita duplicar `get_by_id`, `list_all`, `soft_delete` en cada módulo.  
**Interfaz**: `get_by_id`, `list_all`, `count`, `create`, `update`, `soft_delete`, `hard_delete`.

### 5. `UnitOfWork` como context manager

**Elección**: `UnitOfWork` en `backend/app/core/uow.py`, usado como `async with UnitOfWork() as uow:`.  
**Rationale**: Ningún service llama a `session.commit()` directamente — eso es responsabilidad del UoW. El UoW abre la sesión, provee acceso a repos, hace commit en `__aexit__` o rollback en excepción. Garantiza atomicidad sin que el service deba saber sobre transacciones.

### 6. Seed idempotente con `on_conflict_do_nothing`

**Elección**: El seed usa `INSERT ... ON CONFLICT DO NOTHING` (o equivalente SQLModel/SQLAlchemy) para cada catálogo.  
**Rationale**: Permite ejecutar el seed múltiples veces sin duplicar datos — útil en resets de dev y CI.  
**Datos mínimos**: `Rol` (4 filas), `EstadoPedido` (6 filas con `es_terminal`), `FormaPago` (3 filas), usuario admin inicial.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|-----------|
| `alembic autogenerate` detecta tipos SQLite/PG de forma distinta si se corre fuera de Docker | Documentar que `alembic upgrade head` debe correrse con PostgreSQL activo |
| El usuario admin del seed tiene password conocido | Comentario explícito en seed y en `.env.example` — cambiar en producción |
| `asyncpg` + SQLModel puede tener edge cases con tipos complejos (ARRAY, JSONB) | El ERD v5 usa `INTEGER[]` en `DetallePedido.personalizacion` — verificar soporte en SQLModel con `ARRAY(Integer)` de SQLAlchemy |

## Migration Plan

1. Levantar PostgreSQL: `docker compose up -d`
2. Instalar dependencias: `pip install -r requirements.txt`
3. Correr migración: `alembic upgrade head`
4. Correr seed: `python -m app.db.seed`
5. Verificar: `GET /api/v1/health` devuelve `200 OK`

**Rollback**: `alembic downgrade base` + `docker compose down -v` elimina todo el schema.

## Open Questions

- ¿El campo `DetallePedido.personalizacion` (`INTEGER[]`) se mapea con `ARRAY(Integer)` de SQLAlchemy o como JSON? Verificar soporte nativo de PostgreSQL array en asyncpg/SQLModel.
- ¿El usuario admin del seed debe ser configurable por variable de entorno o hardcodeado solo para dev?
