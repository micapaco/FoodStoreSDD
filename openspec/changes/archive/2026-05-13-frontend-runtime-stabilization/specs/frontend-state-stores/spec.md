## ADDED Requirements

### Requirement: Auth store normalizes persisted roles
The system SHALL normalize persisted auth users so `user.roles` is always treated as a string array before role checks are evaluated.

#### Scenario: Persisted user has roles array
- **WHEN** `authStore` rehydrates a user whose `roles` field is an array of strings
- **THEN** role checks use those roles unchanged

#### Scenario: Persisted user has missing roles
- **WHEN** `authStore` rehydrates a user whose `roles` field is missing
- **THEN** the store normalizes `roles` to an empty array
- **THEN** components do not crash when checking roles

#### Scenario: Persisted user has invalid roles
- **WHEN** `authStore` rehydrates a user whose `roles` field contains non-string values
- **THEN** the store filters non-string values before persisting or checking roles

#### Scenario: Role helper is used for UI permission checks
- **WHEN** navigation, headers, guards or role-aware pages evaluate roles
- **THEN** they use safe role access instead of directly assuming `user.roles` is present
