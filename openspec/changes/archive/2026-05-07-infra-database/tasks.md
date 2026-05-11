## 1. Dependencias y configuración

- [x] 1.1 Agregar `sqlmodel`, `alembic`, `asyncpg`, `psycopg2-binary` a `backend/requirements.txt`
- [x] 1.2 Actualizar `backend/.env.example` con `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`
- [x] 1.3 Actualizar `Settings` en `backend/app/core/config.py`: cambiar `DATABASE_URL` de `Optional[str]` a `str` obligatorio, agregar campos `POSTGRES_*`

## 2. Docker Compose

- [x] 2.1 Crear `backend/docker-compose.yml` con servicio `db` usando `postgres:16-alpine`
- [x] 2.2 Configurar volumen persistente nombrado (`postgres_data`)
- [x] 2.3 Configurar healthcheck con `pg_isready` en el servicio `db`
- [x] 2.4 Leer variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` desde `.env`

## 3. Sesión de base de datos

- [x] 3.1 Crear `backend/app/db/session.py` con engine async (`create_async_engine`) y `AsyncSession`
- [x] 3.2 Implementar `get_session()` como generador async usable con `Depends(get_session)`

## 4. Modelos SQLModel — Dominio Identidad y Acceso

- [x] 4.1 Crear `backend/app/db/models/` (paquete con un archivo por dominio)
- [x] 4.2 Definir modelo `Rol` con PK `codigo` (VARCHAR(20))
- [x] 4.3 Definir modelo `Usuario` con `email` UNIQUE, `password_hash`, `deleted_at`
- [x] 4.4 Definir modelo `UsuarioRol` (tabla pivot con PK compuesta)
- [x] 4.5 Definir modelo `RefreshToken` con `token_hash` UNIQUE, `expires_at`, `revoked_at`
- [x] 4.6 Definir modelo `DireccionEntrega` con `es_principal` default `False`

## 5. Modelos SQLModel — Dominio Catálogo

- [x] 5.1 Definir modelo `Categoria` con `parent_id` FK self-referencial nullable
- [x] 5.2 Definir modelo `Ingrediente` con `nombre` UNIQUE, `es_alergeno`
- [x] 5.3 Definir modelo `Producto` con `precio_base` CHECK `>= 0`, `stock_cantidad` default `0`, `disponible` default `True`
- [x] 5.4 Definir modelo `ProductoCategoria` (tabla pivot con `es_principal`)
- [x] 5.5 Definir modelo `ProductoIngrediente` con `es_removible`
- [x] 5.6 Definir modelo `FormaPago` con PK `codigo` (VARCHAR(20)), `habilitado` default `True`

## 6. Modelos SQLModel — Dominio Ventas y Pagos

- [x] 6.1 Definir modelo `EstadoPedido` con PK `codigo` (VARCHAR(20)), `es_terminal`
- [x] 6.2 Definir modelo `Pedido` con FKs a `EstadoPedido`, `FormaPago`, `DireccionEntrega`; `total` CHECK `>= 0`; `costo_envio` default `50.00`; `deleted_at`
- [x] 6.3 Definir modelo `DetallePedido` con `nombre_snapshot`, `precio_snapshot`, `personalizacion` (INTEGER[])
- [x] 6.4 Definir modelo `HistorialEstadoPedido` con `estado_desde` FK nullable (NULL = transición inicial), `created_at` append-only
- [x] 6.5 Definir modelo `Pago` con `mp_payment_id` UNIQUE nullable, `external_reference` UNIQUE, `idempotency_key` UNIQUE

## 7. Alembic y migración inicial

- [x] 7.1 Inicializar Alembic: estructura creada manualmente (sin `alembic init` — requiere DB)
- [x] 7.2 Configurar `alembic/env.py` para importar `SQLModel.metadata` y usar `DATABASE_URL` desde `Settings`
- [x] 7.3 Configurar `alembic.ini` para tomar `sqlalchemy.url` desde variable de entorno (no hardcodeado)
- [x] 7.4 Generar migración inicial: `alembic/versions/0001_initial_schema.py` escrita manualmente
- [x] 7.5 Revisar y ajustar la migración generada (verificar constraints CHECK, tipos especiales)
- [x] 7.6 Verificar que `alembic upgrade head` aplica sin errores contra PostgreSQL Docker
- [x] 7.7 Verificar que `alembic downgrade base` revierte sin errores

## 8. Patrones de acceso: BaseRepository y UnitOfWork

- [x] 8.1 Crear `backend/app/core/repository.py` con `BaseRepository[T]` genérico
- [x] 8.2 Implementar métodos: `get_by_id`, `list_all`, `count`, `create`, `update`, `soft_delete`, `hard_delete`
- [x] 8.3 Crear `backend/app/core/uow.py` con `UnitOfWork` como async context manager
- [x] 8.4 Implementar commit automático en `__aexit__` sin excepción y rollback en excepción
- [x] 8.5 Exponer atributos de repositorios desde `UnitOfWork` (inicialmente vacíos, se agregan por módulo)

## 9. Seed idempotente

- [x] 9.1 Crear `backend/app/db/seed.py` ejecutable con `python -m app.db.seed`
- [x] 9.2 Implementar inserción idempotente de `Rol` (4 registros) con `ON CONFLICT DO NOTHING`
- [x] 9.3 Implementar inserción idempotente de `EstadoPedido` (6 registros con `es_terminal`) con `ON CONFLICT DO NOTHING`
- [x] 9.4 Implementar inserción idempotente de `FormaPago` (3 registros) con `ON CONFLICT DO NOTHING`
- [x] 9.5 Implementar inserción idempotente del usuario admin (`admin@foodstore.com`, password hasheado, rol `ADMIN`)
- [x] 9.6 Imprimir aviso de seguridad en consola sobre cambio de password en producción
- [x] 9.7 Verificar idempotencia: ejecutar seed dos veces y confirmar que no hay duplicados ni errores

## 10. Verificación final

- [x] 10.1 `docker compose up -d` levanta PostgreSQL correctamente
- [x] 10.2 `alembic upgrade head` aplica sin errores
- [x] 10.3 `python -m app.db.seed` inserta catálogos y admin sin errores
- [x] 10.4 `uvicorn` arranca sin errores con `DATABASE_URL` configurado
- [x] 10.5 `GET /api/v1/health` retorna `200 OK`
- [x] 10.6 `docker compose down -v` + repetir pasos 10.1–10.5 confirma que todo funciona desde cero
