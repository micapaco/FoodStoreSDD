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

---

### Requirement: Product seed
The system SHALL preload a set of example products after migration.

#### Scenario: Seed products
- **WHEN** `app/db/seed.py` runs after `alembic upgrade head`
- **THEN** the following products SHALL exist:
  - "Pizza Mozzarella" ($1200, disponible=true, stock=50, categoría: "Pizzas", ingredientes: Queso, Tomate)
  - "Hamburguesa Clásica" ($850, disponible=true, stock=30, categoría: "Hamburguesas", ingredientes: Queso, Lechuga, Tomate, Cebolla)
  - "Coca-Cola 500ml" ($250, disponible=true, stock=100, categoría: "Gaseosas")
  - "Agua Mineral 500ml" ($200, disponible=true, stock=80, categoría: "Aguas")
  - "Papas Fritas" ($400, disponible=true, stock=60, categoría: "Snacks")
  - "Flan con Crema" ($500, disponible=true, stock=20, categoría: "Postres")

#### Scenario: Product-ingredient relationships
- **WHEN** seed runs
- **THEN** "Pizza Mozzarella" SHALL have ingredientes: "Queso" (no removible), "Tomate" (no removible)
- **THEN** "Hamburguesa Clásica" SHALL have ingredientes: "Queso" (removible), "Lechuga" (removible), "Tomate" (removible), "Cebolla" (removible)

#### Scenario: Producto seed is idempotent
- **WHEN** seed runs multiple times
- **THEN** products SHALL NOT be duplicated (upsert by nombre or skip if exist)
