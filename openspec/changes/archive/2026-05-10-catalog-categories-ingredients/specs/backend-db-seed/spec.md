## ADDED Requirements

### Requirement: Category seed
The system SHALL preload a set of base categories after migration.

#### Scenario: Seed categories
- **WHEN** `app/db/seed.py` runs after `alembic upgrade head`
- **THEN** the following categories SHALL exist: "Bebidas", "Comidas", "Snacks", "Postres", "Salsas y Aderezos"
- **THEN** "Bebidas" SHALL have subcategories: "Gaseosas", "Aguas", "Jugos"
- **THEN** "Comidas" SHALL have subcategories: "Hamburguesas", "Pizzas", "Empanadas"

#### Scenario: Seed is idempotent
- **WHEN** seed runs multiple times
- **THEN** categories SHALL NOT be duplicated (upsert by nombre or skip if exist)

---

### Requirement: Ingredient seed
The system SHALL preload a set of common ingredients after migration.

#### Scenario: Seed ingredients
- **WHEN** `app/db/seed.py` runs after `alembic upgrade head`
- **THEN** the following ingredients SHALL exist: "Queso", "Lechuga", "Tomate", "Cebolla", "Huevo", "Gluten", "Leche", "Maní", "Soja", "Mostaza"
- **THEN** "Gluten", "Leche", "Maní", "Huevo", "Soja" SHALL have `es_alergeno = true`
- **THEN** the rest SHALL have `es_alergeno = false`

#### Scenario: Seed is idempotent
- **WHEN** seed runs multiple times
- **THEN** ingredients SHALL NOT be duplicated (upsert by nombre or skip if exist)
