# system-config-api Specification

## Purpose
TBD - created by archiving change system-config. Update Purpose after archive.
## Requirements
### Requirement: Listar parámetros de configuración
The system SHALL expose `GET /api/v1/admin/configuracion` to return all system configuration parameters.
Access requires role `ADMIN`.
Response: `{ parametros: [{ clave, valor, updated_by_id, updated_at }] }`.

#### Scenario: Admin lee todos los parámetros
- **WHEN** an ADMIN sends `GET /admin/configuracion`
- **THEN** the system returns HTTP 200 with all configuration rows including `costo_envio_base`, `pedidos_habilitados`, and `mensaje_sistema`

#### Scenario: Acceso sin rol ADMIN
- **WHEN** a non-ADMIN user calls the endpoint
- **THEN** the system returns HTTP 403

---

### Requirement: Editar un parámetro de configuración
The system SHALL expose `PUT /api/v1/admin/configuracion/{clave}` to update a single parameter value.
Access requires role `ADMIN`.
Body: `{ valor: string }`.
Response: the updated `ConfigParametro` row.
If `clave` does not exist in the `configuracion` table, return HTTP 404.
The `updated_by_id` MUST be set to the current user's id and `updated_at` MUST be refreshed on every write.

#### Scenario: Admin edita costo_envio_base
- **WHEN** an ADMIN sends `PUT /admin/configuracion/costo_envio_base` with `{ "valor": "75.00" }`
- **THEN** the system returns HTTP 200 with the updated row and subsequent order creation uses $75.00 as the delivery cost

#### Scenario: Admin desactiva pedidos
- **WHEN** an ADMIN sends `PUT /admin/configuracion/pedidos_habilitados` with `{ "valor": "false" }`
- **THEN** subsequent `POST /pedidos` attempts return HTTP 503

#### Scenario: Clave inexistente
- **WHEN** an ADMIN sends `PUT /admin/configuracion/clave_inventada`
- **THEN** the system returns HTTP 404

---

### Requirement: Endpoint público de configuración
The system SHALL expose `GET /api/v1/configuracion/publica` without authentication to return client-facing parameters.
Response: `{ costo_envio_base: number, pedidos_habilitados: boolean }`.

#### Scenario: Cliente lee configuración pública
- **WHEN** any user (authenticated or not) sends `GET /configuracion/publica`
- **THEN** the system returns HTTP 200 with the current values of `costo_envio_base` and `pedidos_habilitados`

---

### Requirement: Bloqueo de creación de pedidos cuando pedidos_habilitados=false
The system SHALL block `POST /api/v1/pedidos` when the `pedidos_habilitados` configuration parameter is `"false"`.
Response: HTTP 503 with message "El local no está aceptando pedidos en este momento."

#### Scenario: Pedido bloqueado por configuración
- **WHEN** `pedidos_habilitados` is set to `"false"` and a client attempts `POST /pedidos`
- **THEN** the system returns HTTP 503 with the appropriate message

#### Scenario: Pedido permitido cuando habilitado
- **WHEN** `pedidos_habilitados` is `"true"` and a client submits a valid order
- **THEN** the system processes the order normally

