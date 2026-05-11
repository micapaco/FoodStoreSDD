## ADDED Requirements

### Requirement: Modelos SQLModel que reflejan el ERD v5

El backend SHALL definir todos los modelos SQLModel en `backend/app/db/models.py` (o en subarchivos importados desde ese módulo), cubriendo los tres dominios del ERD v5: identidad/acceso, catálogo y ventas/pagos. Cada modelo SHALL mapear fielmente los tipos, constraints y relaciones definidos en el ERD v5.

**Dominio 1 — Identidad y Acceso**: `Usuario`, `Rol`, `UsuarioRol`, `RefreshToken`, `DireccionEntrega`  
**Dominio 2 — Catálogo**: `Categoria`, `Producto`, `Ingrediente`, `ProductoCategoria`, `ProductoIngrediente`, `FormaPago`  
**Dominio 3 — Ventas y Pagos**: `EstadoPedido`, `Pedido`, `DetallePedido`, `HistorialEstadoPedido`, `Pago`

#### Scenario: Modelo Usuario tiene campos correctos

- **WHEN** se inspecciona la tabla `usuario` en la base de datos tras `alembic upgrade head`
- **THEN** la tabla tiene columnas `id` (BIGSERIAL PK), `email` (VARCHAR(254) UNIQUE NOT NULL), `password_hash` (CHAR(60) NOT NULL), `deleted_at` (TIMESTAMPTZ NULL) y timestamps de creación/actualización

#### Scenario: Claves primarias de catálogos son VARCHAR semántico

- **WHEN** se inspecciona la tabla `rol` en la base de datos
- **THEN** la columna `codigo` es VARCHAR(20) y actúa como PK (sin columna `id` numérica)

#### Scenario: Modelo DetallePedido tiene snapshot de precio y nombre

- **WHEN** se crea un `DetallePedido`
- **THEN** los campos `nombre_snapshot` (VARCHAR(200) NOT NULL) y `precio_snapshot` (DECIMAL(10,2) NOT NULL) almacenan el valor histórico del producto al momento de la compra, independiente de cambios posteriores al producto

### Requirement: Configuración Alembic con migración inicial

El proyecto SHALL incluir configuración Alembic en `backend/alembic/` con un `env.py` que importe `SQLModel.metadata` como `target_metadata`, de modo que `alembic revision --autogenerate` detecte automáticamente los modelos SQLModel. El change SHALL incluir la migración inicial `0001_initial.py` que crea el schema completo del ERD v5.

#### Scenario: Migración inicial aplica sin errores

- **GIVEN** una base de datos PostgreSQL vacía y accesible vía `DATABASE_URL`
- **WHEN** se ejecuta `alembic upgrade head`
- **THEN** todas las tablas del ERD v5 son creadas, sin errores, y `alembic_version` registra la revisión `0001`

#### Scenario: Rollback de la migración inicial

- **WHEN** se ejecuta `alembic downgrade base`
- **THEN** todas las tablas creadas por `0001_initial.py` son eliminadas y la base de datos queda vacía

#### Scenario: Autogenerate detecta estado sincronizado

- **GIVEN** `alembic upgrade head` ya fue ejecutado
- **WHEN** se ejecuta `alembic revision --autogenerate -m "check"`
- **THEN** la migración generada no contiene cambios (schema y modelos están sincronizados)

### Requirement: Constraints y tipos específicos del ERD v5

Los modelos SHALL implementar los siguientes constraints críticos:
- `Producto.precio_base`: `CHECK (precio_base >= 0)`
- `Producto.stock_cantidad`: default `0`
- `Pedido.total`: `CHECK (total >= 0)`
- `Pedido.costo_envio`: default `50.00`
- `DireccionEntrega.es_principal`: default `False`
- `HistorialEstadoPedido`: append-only (sin UPDATE ni DELETE a nivel de aplicación)
- `DetallePedido.personalizacion`: array de IDs de ingredientes removidos (`INTEGER[]` o equivalente)

#### Scenario: Precio negativo rechazado a nivel de base de datos

- **WHEN** se intenta insertar un `Producto` con `precio_base = -1`
- **THEN** la base de datos rechaza la operación con violación de constraint CHECK

#### Scenario: Pago tiene idempotency_key único

- **WHEN** se intenta insertar dos `Pago` con el mismo `idempotency_key`
- **THEN** la base de datos rechaza el segundo insert con violación de UNIQUE constraint
