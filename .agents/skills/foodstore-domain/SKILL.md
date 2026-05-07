---
name: foodstore-domain
description: Cross-domain conventions for Food Store — ERD v5, FSM state machine, business rules RN-01 to RN-05, RBAC, MercadoPago payment flow, naming conventions, and evaluation rubric. Trigger: When working on cross-domain tasks, reviewing architecture, or needing domain knowledge about entities, state transitions, or business rules.
---

# Food Store — Domain Knowledge

Load this skill for cross-domain tasks, architectural decisions, or when you need domain context about entities, business rules, or the evaluation criteria. Source: `docs/Integrador.txt` v5.0.

## ERD v5 — Data Model

The schema applies 3NF, Soft Delete (`deleted_at TIMESTAMPTZ`), Snapshot Pattern, and Append-Only Audit Trail.

### Domain 1 — Identity & Access

| Entity | Key Field | Type | Constraint | Notes |
|--------|-----------|------|------------|-------|
| Usuario | id | BIGSERIAL | PK | Soft-delete via deleted_at |
| Usuario | email | VARCHAR(254) | UQ, NN | Validate with EmailStr |
| Usuario | password_hash | CHAR(60) | NN | bcrypt cost≥12. NEVER plaintext |
| Rol | codigo | VARCHAR(20) | PK (semantic) | ADMIN \| STOCK \| PEDIDOS \| CLIENT |
| UsuarioRol | (usuario_id, rol_codigo) | BIGINT + VARCHAR | Composite PK | N:M pivot. Includes asignado_por_id |
| RefreshToken | token_hash | CHAR(64) | UQ, NN | SHA-256 of token. revoked_at NULL = active |
| RefreshToken | expires_at | TIMESTAMPTZ | NN | 7 days from issuance |
| RefreshToken | revoked_at | TIMESTAMPTZ | NULL | Set on POST /auth/logout |
| DireccionEntrega | alias | VARCHAR(50) | NULL | e.g. 'Casa', 'Trabajo' |
| DireccionEntrega | linea1 | TEXT | NN | |
| DireccionEntrega | es_principal | BOOLEAN | NN, default false | Only one per user |

### Domain 2 — Product Catalog

| Entity | Key Field | Type | Constraint | Notes |
|--------|-----------|------|------------|-------|
| Categoria | parent_id | BIGINT | FK self-ref, NULL | Recursive hierarchy. ON DELETE SET NULL. CTE. |
| Producto | precio_base | DECIMAL(10,2) | CHECK ≥ 0, NN | Snapshot on order creation |
| Producto | stock_cantidad | INTEGER | CHECK ≥ 0, NN, default 0 | Managed by STOCK role |
| Producto | disponible | BOOLEAN | NN, default true | Manual toggle independent of stock |
| Ingrediente | nombre | VARCHAR(100) | UQ, NN | |
| Ingrediente | es_alergeno | BOOLEAN | NN, default false | Allergen badge in UI |
| ProductoCategoria | (producto_id, cat_id) | BIGINT×2 | Composite PK | N:M pivot. es_principal. |
| ProductoIngrediente | es_removible | BOOLEAN | NN | Enables order customization |
| FormaPago | codigo | VARCHAR(20) | PK semantic | MERCADOPAGO \| EFECTIVO \| TRANSFERENCIA |
| FormaPago | habilitado | BOOLEAN | NN, default true | Can disable without deleting |

### Domain 3 — Sales, Payments & Traceability

| Entity | Key Field | Type | Constraint | Notes |
|--------|-----------|------|------------|-------|
| EstadoPedido | codigo | VARCHAR(20) | PK semantic | Catalog. See FSM. |
| EstadoPedido | es_terminal | BOOLEAN | NN | true = no outgoing transitions |
| Pedido | estado_codigo | VARCHAR(20) | FK → EstadoPedido | Current order state |
| Pedido | total | DECIMAL(10,2) | CHECK ≥ 0, NN | Immutable snapshot on creation |
| Pedido | costo_envio | DECIMAL(10,2) | NN, default 50.00 | Fixed value v1 |
| Pedido | forma_pago_codigo | VARCHAR(20) | FK → FormaPago | Aligned with semantic PK |
| Pedido | direccion_id | BIGINT | FK, SET NULL | NULL = pickup (valid) |
| DetallePedido | nombre_snapshot | VARCHAR(200) | NN, snap | Immutable name at creation |
| DetallePedido | precio_snapshot | DECIMAL(10,2) | NN, snap | Immutable price at creation |
| DetallePedido | personalizacion | INTEGER[] | NULL | IDs of removed ingredients |
| HistorialEstadoPedido | estado_desde | VARCHAR(20) | FK, NULL | NULL = initial transition (RN-02) |
| HistorialEstadoPedido | created_at | TIMESTAMPTZ | NN, append-only | Never updated_at (RN-03) |
| Pago | mp_payment_id | BIGINT | UQ, NULL | ID returned by MercadoPago |
| Pago | mp_status | VARCHAR(30) | NN | pending / approved / rejected |
| Pago | external_reference | VARCHAR(100) | UQ, NN | Order UUID as MP reference |
| Pago | idempotency_key | VARCHAR(100) | UQ, NN | Backend-generated UUID. Prevents duplicate charges. |

## FSM — Order State Machine

The service layer validates transitions against this map BEFORE each INSERT into HistorialEstadoPedido. No router can bypass this.

| State | Description | Order | Terminal | Valid Transitions |
|-------|-------------|-------|----------|-------------------|
| PENDIENTE | Order created, payment pending | 1 | false | → CONFIRMADO, → CANCELADO |
| CONFIRMADO | Payment processed and confirmed | 2 | false | → EN_PREP, → CANCELADO |
| EN_PREP | Being prepared in kitchen | 3 | false | → EN_CAMINO, → CANCELADO (ADMIN/PEDIDOS only) |
| EN_CAMINO | Dispatched to client | 4 | false | → ENTREGADO |
| ENTREGADO | Delivery confirmed | 5 | **TRUE** | — (terminal) |
| CANCELADO | Order cancelled | 6 | **TRUE** | — (terminal) |

## Business Rules — MANDATORY

These are invariants. They must be enforced in the Service layer, never skipped.

| Rule | Description | Enforced in |
|------|-------------|-------------|
| **RN-01** | A state with `es_terminal = true` does NOT allow outgoing transitions | Service — FSM validation |
| **RN-02** | First HistorialEstadoPedido record always has `estado_desde = NULL` | Service — order creation |
| **RN-03** | HistorialEstadoPedido is **append-only**: no UPDATE, no DELETE ever | Repository + Service |
| **RN-04** | total, nombre_snapshot, precio_snapshot in DetallePedido are **immutable** snapshots | Service — order creation |
| **RN-05** | `motivo` is **mandatory** when `nuevo_estado = CANCELADO` | Service — state transition |

## MercadoPago — Payment Flow

```
Frontend (CardPayment SDK) → tokenizes card → card_token
Frontend → POST /api/v1/pagos/crear { card_token, pedido_id }
Backend → generates idempotency_key UUID
Backend → calls MercadoPago API with token + idempotency_key
MercadoPago → returns mp_payment_id + status
Backend → INSERT into Pago table via UoW
MercadoPago → POST /pagos/webhook (IPN) with topic=payment
Backend → if approved: UoW advances Pedido to CONFIRMADO
Frontend → polling detects state change → updates UI
```

**Critical**: Card data NEVER passes through Food Store's server. PCI SAQ-A compliant.

### Payment States

| MP Status | Action in Food Store |
|-----------|---------------------|
| approved | Webhook auto-advances order to CONFIRMADO via UoW |
| pending | Order stays PENDIENTE. Webhook will confirm when credited. |
| rejected | Show status_detail to client. Order stays PENDIENTE. |
| in_process | Order stays PENDIENTE. Webhook will notify resolution. |
| cancelled | Client can retry or cancel order. |

## Naming Conventions

| Context | Convention | Example |
|---------|-----------|---------|
| Python variables, functions, modules | `snake_case` | `crear_pedido`, `stock_cantidad` |
| Python classes | `PascalCase` | `DetallePedido`, `BaseRepository` |
| TypeScript variables, functions | `camelCase` | `addItem`, `cartStore` |
| React components | `PascalCase` | `CatalogoGrid`, `CartDrawer` |
| Database tables | `snake_case` | `historial_estado_pedido` |
| API endpoints | `snake_case` with `/api/v1/` prefix | `/api/v1/pedidos/{id}/estado` |
| Commits | Conventional commits | `feat(auth): add JWT refresh rotation` |

## Evaluation Rubric — 200 Points

Know what gets evaluated to prioritize quality where it matters.

| Criteria | Points | Excellent requirement |
|----------|--------|-----------------------|
| Backend Structure & Config | 10 | Layers router/service/uow/repository/model. Feature modules. core/ separated. Alembic + seed. CORS + rate limiting. |
| Backend Data Model | 15 | SQLModel correct, constraints, soft-delete, snapshot, all entities. |
| Backend UoW & Repository | 15 | UoW with context manager, auto commit/rollback. BaseRepository[T]. No service.session.commit(). |
| Backend Service Layer | 15 | FSM implemented. RN-01/02/03/05 validated. Stateless services. Service receives uow as parameter. |
| Backend REST Controllers | 15 | Correct HTTP verbs, semantic routes, precise status codes, /api/v1 prefix. Separate Pydantic schemas. |
| Backend MercadoPago | 15 | SDK configured with idempotency_key UUID. Webhook processes topic=payment. Complete Pago table. |
| Frontend Structure & TS | 10 | Feature-sliced: pages/features/components/hooks/store/api/types. No cross-imports. strict: true, no any. |
| Frontend Zustand | 10 | 4 stores implemented and typed. Correct persist per store. Subscription by slice. |
| Frontend TanStack Query | 15 | useQuery/useMutation for all fetch. Descriptive queryKeys. Invalidation after mutations. Auto refresh 401. |
| Frontend Client Features | 15 | Catalog with debounce/filters/pagination/skeleton. Cart persist. Checkout with MP CardPayment. Timeline with 30s polling. |
| Frontend Admin Panel | 15 | Dashboard KPIs + recharts. CRUD categories/products with relations. Order management with FSM. Stock management. |
| UI/UX & Design | 10 | Consistent design system. Mobile-first. Skeleton loaders, toasts, confirmation modals, empty states. |
| Code Quality | 10 | snake_case/camelCase/PascalCase. Functions < 50 lines. SRP. Docstrings. JSDoc. Complete README.md. |

**Bonus**: +10 pts for pytest with >60% coverage. +10 pts for functional deploy.
**Penalty**: -30% if project doesn't run locally following README.

## Commit Conventions

```
feat(modulo): description of the change
fix(modulo): description of the bug fixed
refactor(modulo): description of the refactor
test(modulo): description of the tests
docs(modulo): description of the docs change
```

No Co-Authored-By or AI attribution. Conventional commits only.
