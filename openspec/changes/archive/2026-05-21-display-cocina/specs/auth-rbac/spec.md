## MODIFIED Requirements

### Requirement: Four fixed roles
The system SHALL enforce exactly 5 roles: ADMIN, STOCK, PEDIDOS, CLIENT, COCINA.
A user SHALL have exactly one active role at a time, with the exception of the operative combination STOCK+PEDIDOS which may coexist.

#### Scenario: Registration assigns CLIENT role
- **WHEN** a new user registers successfully
- **THEN** the role CLIENT is automatically assigned by the service
- **AND** it MUST NOT come from the request body

#### Scenario: Single role token
- **WHEN** a user has role ADMIN
- **THEN** the access token's roles claim contains ["ADMIN"]

#### Scenario: COCINA role assignment
- **WHEN** an ADMIN assigns the COCINA role to a user
- **THEN** the user can access the `/cocina` endpoint and KDS screen

#### Scenario: Multiple role assignment rejected
- **WHEN** an ADMIN attempts to assign more than one role to a user (except STOCK+PEDIDOS combination)
- **THEN** the system rejects the request with validation error

## ADDED Requirements

### Requirement: Rol COCINA en seed idempotente
El sistema SHALL incluir el rol `COCINA` en el seed de roles con inserción idempotente.

#### Scenario: Seed de rol COCINA
- **WHEN** se ejecuta el seed de roles
- **THEN** existe el registro `Rol(codigo='COCINA', nombre='Cocinero')` en la tabla `rol`
- **THEN** la inserción usa `ON CONFLICT DO NOTHING` para ser idempotente

#### Scenario: Asignación de rol COCINA a usuario
- **WHEN** un ADMIN asigna el rol `COCINA` a un usuario existente
- **THEN** el usuario puede autenticarse y recibir un token con `roles: ["COCINA"]`
- **THEN** el usuario tiene acceso a los endpoints de cocina y puede ejecutar transiciones FSM autorizadas
