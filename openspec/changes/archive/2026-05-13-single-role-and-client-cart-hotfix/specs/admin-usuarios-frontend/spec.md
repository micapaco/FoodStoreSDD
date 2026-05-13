## MODIFIED Requirements

### Requirement: Cambio de roles de usuario
El modal de edición SHALL incluir un selector de rol único.
Los roles disponibles son: ADMIN, STOCK, PEDIDOS, CLIENT.
No debe permitir guardar sin rol seleccionado.

#### Scenario: Cambio de rol exitoso
- **WHEN** ADMIN modifica el rol y guarda
- **THEN** el frontend envía `{ roles: [rolSeleccionado] }`
- **AND** el sistema actualiza el rol y muestra el nuevo badge en la tabla

#### Scenario: Protección del último ADMIN
- **WHEN** ADMIN intenta quitar el rol ADMIN al único administrador
- **THEN** el backend rechaza la operación y el frontend muestra el error
