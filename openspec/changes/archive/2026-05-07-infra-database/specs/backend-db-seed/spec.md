## ADDED Requirements

### Requirement: Script seed idempotente para catálogos base

El backend SHALL incluir un script `backend/app/db/seed.py` ejecutable con `python -m app.db.seed` que inserte los datos mínimos necesarios para que el sistema funcione: catálogos `Rol`, `EstadoPedido` y `FormaPago`. El script SHALL ser idempotente — ejecutarlo múltiples veces no duplica datos ni falla.

**Datos a insertar**:

| Entidad | Registros |
|---------|-----------|
| `Rol` | `ADMIN`, `STOCK`, `PEDIDOS`, `CLIENT` |
| `EstadoPedido` | `PENDIENTE` (orden 1, no terminal), `CONFIRMADO` (2, no), `EN_PREP` (3, no), `EN_CAMINO` (4, no), `ENTREGADO` (5, terminal), `CANCELADO` (6, terminal) |
| `FormaPago` | `MERCADOPAGO` (habilitado), `EFECTIVO` (habilitado), `TRANSFERENCIA` (habilitado) |

#### Scenario: Primera ejecución del seed

- **GIVEN** una base de datos con el schema aplicado pero sin datos (post `alembic upgrade head`)
- **WHEN** se ejecuta `python -m app.db.seed`
- **THEN** las tablas `rol`, `estado_pedido` y `forma_pago` contienen exactamente los registros definidos arriba

#### Scenario: Ejecución repetida del seed (idempotencia)

- **GIVEN** el seed ya fue ejecutado previamente
- **WHEN** se ejecuta `python -m app.db.seed` de nuevo
- **THEN** no se duplican registros, no se lanza error, y el conteo de filas es el mismo que tras la primera ejecución

#### Scenario: Sistema no funciona sin seed

- **GIVEN** una base de datos con schema pero sin datos de seed
- **WHEN** se intenta crear un usuario con rol `CLIENT`
- **THEN** la operación falla por FK violation (el rol `CLIENT` no existe) — confirmando que el seed es prerequisito

### Requirement: Usuario admin inicial en el seed

El script seed SHALL crear un usuario administrador inicial con email `admin@foodstore.com`, password hasheado de `Admin1234!` y rol `ADMIN`. El seed SHALL ser idempotente respecto a este usuario — si ya existe, lo omite sin error.

El script SHALL imprimir un aviso visible en consola recordando cambiar el password del admin en producción.

#### Scenario: Usuario admin creado en primera ejecución

- **GIVEN** una base de datos recién migrada
- **WHEN** se ejecuta el seed
- **THEN** existe un usuario con email `admin@foodstore.com` y rol `ADMIN`

#### Scenario: Seed no duplica el usuario admin

- **GIVEN** el seed ya fue ejecutado y el usuario admin existe
- **WHEN** se ejecuta el seed de nuevo
- **THEN** sigue habiendo exactamente un usuario con email `admin@foodstore.com`

#### Scenario: Aviso de seguridad en consola

- **WHEN** se ejecuta el seed
- **THEN** el script imprime un mensaje indicando que el password `Admin1234!` debe cambiarse antes de ir a producción
