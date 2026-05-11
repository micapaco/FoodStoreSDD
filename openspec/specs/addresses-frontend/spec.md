## ADDED Requirements

### Requirement: Pantalla “Mis Direcciones” disponible para CLIENT
El sistema SHALL proveer una pantalla de gestión de direcciones para usuarios con rol `CLIENT`.

#### Scenario: Navegación a Mis Direcciones
- **WHEN** un usuario autenticado con rol `CLIENT` navega a `/direcciones`
- **THEN** el sistema renderiza la pantalla “Mis Direcciones”

#### Scenario: Usuario sin rol CLIENT no accede
- **WHEN** un usuario autenticado sin rol `CLIENT` navega a `/direcciones`
- **THEN** el sistema aplica el guard de rol y niega el acceso (403 o redirección a `/403`)

---

### Requirement: Listado y selección de dirección principal
El sistema SHALL permitir ver el listado de direcciones y marcar una como principal.

#### Scenario: Ver listado de direcciones
- **WHEN** la pantalla “Mis Direcciones” carga
- **THEN** el frontend solicita `GET /api/v1/direcciones?page=1&page_size=10`
- **THEN** el usuario ve un listado con indicador de `principal`

#### Scenario: Marcar como principal desde UI
- **WHEN** el usuario elige “Marcar como principal” en una dirección
- **THEN** el frontend envía `PATCH /api/v1/direcciones/{id}/principal`
- **THEN** el listado se refresca y refleja la nueva dirección principal

---

### Requirement: Crear / editar / eliminar direcciones desde UI
El sistema SHALL permitir gestionar direcciones desde la UI.

#### Scenario: Crear dirección
- **WHEN** el usuario completa el formulario y confirma
- **THEN** el frontend envía `POST /api/v1/direcciones`
- **THEN** el listado se actualiza mostrando la nueva dirección

#### Scenario: Editar dirección
- **WHEN** el usuario edita una dirección existente y confirma
- **THEN** el frontend envía `PUT /api/v1/direcciones/{id}`
- **THEN** el listado se actualiza mostrando los cambios

#### Scenario: Eliminar dirección
- **WHEN** el usuario confirma eliminar una dirección
- **THEN** el frontend envía `DELETE /api/v1/direcciones/{id}`
- **THEN** el listado se actualiza y la dirección deja de aparecer

---

### Requirement: Server state con TanStack Query
El frontend SHALL manejar el estado del servidor de direcciones usando TanStack Query.

#### Scenario: Invalidación tras mutaciones
- **WHEN** una mutación de direcciones (create/update/delete/set principal) finaliza con éxito
- **THEN** el query de listado de direcciones se invalida o se refresca para reflejar el estado real del servidor
