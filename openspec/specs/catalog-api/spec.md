## ADDED Requirements

### Requirement: Public catalog endpoint
The system SHALL expose a public endpoint that combines category tree and ingredient listing for catalog browsing.

#### Scenario: Get catalog overview
- **WHEN** any user sends `GET /api/v1/catalogo/resumen`
- **THEN** the system returns `200 OK` with the category tree and ingredient count

#### Scenario: Unauthenticated access
- **WHEN** an anonymous user accesses catalog endpoints
- **THEN** the system returns public data without requiring authentication
