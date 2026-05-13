## MODIFIED Requirements

### Requirement: Four fixed roles
The system SHALL enforce exactly 4 roles: ADMIN, STOCK, PEDIDOS, CLIENT.
A user SHALL have exactly one active role at a time.

#### Scenario: Registration assigns CLIENT role
- **WHEN** a new user registers successfully
- **THEN** the role CLIENT is automatically assigned by the service
- **AND** it MUST NOT come from the request body

#### Scenario: Single role token
- **WHEN** a user has role ADMIN
- **THEN** the access token's roles claim contains ["ADMIN"]

#### Scenario: Multiple role assignment rejected
- **WHEN** an ADMIN attempts to assign more than one role to a user
- **THEN** the system rejects the request with validation error
