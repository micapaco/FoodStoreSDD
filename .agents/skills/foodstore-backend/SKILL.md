---
name: foodstore-backend
description: Backend conventions for Food Store — layered architecture, feature-first modules, UoW, BaseRepository, schemas, HTTP conventions, and all patterns from Integrador.txt. Trigger: When implementing any backend task including routers, services, models, repositories, schemas, migrations, auth, or business logic.
---

# Food Store — Backend Conventions

Load this skill before writing ANY backend code for Food Store. These rules come from `docs/Integrador.txt` and are mandatory.

## Architecture — Layered with Unidirectional Dependencies

```
Router → Service → UoW → Repository → Model
```

**This is the golden rule.** No layer can import from the layer above it. A Model NEVER imports from a Service. A Repository NEVER imports from a Router.

| Layer | File | Responsibility | Knows about |
|-------|------|---------------|-------------|
| Router | `router.py` | HTTP only: parse request, validate Pydantic schema, delegate to Service, serialize response with `response_model`. **No business logic.** | Service |
| Service | `service.py` | Business logic: stateless, orchestrates operations via UoW. Raises exceptions. **Never calls commit/rollback.** | UoW |
| Unit of Work | `core/uow.py` | Transaction management: opens DB session, provides access to all repositories. Auto `commit()` on success, `rollback()` on error. | Repository, Session |
| Repository | `repository.py` | DB access: queries without business logic. Inherits from `BaseRepository[T]`. Receives session from UoW by injection. | Model, Session |
| Model | `model.py` | SQLModel tables + relationships. **Zero imports from upper layers.** | Nothing |

## Module Structure — Feature-First

Every feature module lives in `app/modules/<feature>/` with this structure:

```
app/modules/<feature>/
├── __init__.py
├── model.py        # SQLModel tables + relationships
├── repository.py   # BaseRepository[T] subclass
├── service.py      # Business logic (stateless)
├── router.py       # FastAPI router (HTTP only)
└── schemas.py      # Pydantic v2 Create/Update/Read
```

Backend modules defined by the spec:

| Module | Path | Description |
|--------|------|-------------|
| auth | `app/modules/auth/` | Login, register, refresh, logout. JWT + rate limiting. |
| refreshtokens | `app/modules/refreshtokens/` | RefreshToken model for secure logout invalidation. |
| usuarios | `app/modules/usuarios/` | CRUD users + RBAC role assignment. Soft delete. |
| direcciones | `app/modules/direcciones/` | CRUD DireccionEntrega per user. PATCH /principal. |
| categorias | `app/modules/categorias/` | Hierarchical categories with recursive CTE. Soft delete. |
| productos | `app/modules/productos/` | Catalog with Ingrediente (es_alergeno). Stock as field. |
| pedidos | `app/modules/pedidos/` | Central domain: FSM, audit trail, append-only history. |
| pagos | `app/modules/pagos/` | MercadoPago integration: create payment, webhook IPN. |
| admin | `app/modules/admin/` | Dashboard metrics, stock management, user management. |

## Mandatory Patterns

### Unit of Work (UoW)

- Implemented as a context manager in `core/uow.py`
- The Service receives `uow` as parameter — never creates its own
- `commit()` is automatic on `__exit__` without exceptions
- `rollback()` is automatic on `__exit__` with exceptions
- **No service EVER calls `session.commit()` directly**

```python
# In router — the ONLY place that opens UoW context
async def create_pedido(body: CrearPedidoRequest, ...):
    with UnitOfWork() as uow:
        result = service.crear_pedido(uow, body, usuario_id)
    return result
```

### BaseRepository[T]

Generic repository with these methods:

| Method | Description |
|--------|-------------|
| `get_by_id(entity_id: int) → T \| None` | Get by PK. Returns None if not found. |
| `list_all(skip: int, limit: int) → list[T]` | Simple list. Complex queries go in specific repos. |
| `count() → int` | Total count for pagination. |
| `create(entity: T) → T` | Add to session + flush() + refresh(). Returns entity with ID. |
| `update(entity: T) → T` | Add modified entity + flush() + refresh(). |
| `soft_delete(entity: T) → None` | Sets `deleted_at = now()`. Only for soft-delete entities. |
| `hard_delete(entity: T) → None` | Physical delete. Only when model has no soft-delete. |

### Soft Delete

- All business entities use `deleted_at TIMESTAMPTZ` — never physical DELETE
- All GET queries filter `WHERE deleted_at IS NULL`
- Deleted records are invisible to the API

### Snapshot Pattern

- `DetallePedido.nombre_snapshot` and `DetallePedido.precio_snapshot` are immutable copies taken at order creation time
- They NEVER reflect subsequent changes to the product
- `Pedido.total` is also a snapshot — immutable once created

### Audit Trail — Append-Only

- `HistorialEstadoPedido` is append-only: only INSERT, NEVER UPDATE or DELETE (RN-03)
- Each transition records `estado_desde`, `estado_hasta`, `cambiado_por_id`, `created_at`
- First record always has `estado_desde = NULL` (RN-02)

## Pydantic v2 Schemas

- Always define **separate schemas**: `Create`, `Update`, `Read`
- **Never expose SQLModel directly** as a response — always use a Read schema
- Use `EmailStr` for email validation
- Use `model_validate()` for serialization

```python
# schemas.py — correct pattern
class ProductoCreate(BaseModel): ...   # Input for creation
class ProductoUpdate(BaseModel): ...   # Input for update (partial)
class ProductoRead(BaseModel): ...     # Output — never includes internal fields
```

## HTTP Conventions

- All endpoints use prefix `/api/v1`
- Errors follow **RFC 7807** (Problem Details): `application/problem+json`
- Error response: `{ "type", "title", "status", "detail", "instance", "code" }`

| Action | Status Code |
|--------|-------------|
| Create resource | `201 Created` |
| Successful action | `200 OK` |
| Delete (soft) | `204 No Content` |
| Validation error | `422 Unprocessable Entity` |
| Auth required | `401 Unauthorized` |
| Insufficient role | `403 Forbidden` |
| Not found | `404 Not Found` |
| Conflict | `409 Conflict` |
| Rate limited | `429 Too Many Requests` with `Retry-After` header |

### Pagination

```json
GET /api/v1/recursos?page=1&size=20
→ { "items": [...], "total": N, "page": 1, "size": 20, "pages": P }
```

## Auth & RBAC

- JWT access token: 30 min expiration
- JWT refresh token: 7 days, stored hashed (SHA-256) in `RefreshToken` table
- `revoked_at = NULL` means active; populated on logout
- `get_current_user()` dependency validates JWT and loads user
- `require_role([Rol.ADMIN])` dependency checks roles from token
- Rate limiting on login: 5 attempts per IP in 15 minutes (slowapi)

### Roles

| Role | Code | Permissions |
|------|------|-------------|
| Administrador | `ADMIN` | Full CRUD on everything. Assigns roles. |
| Gestor de Stock | `STOCK` | Read products, update stock_cantidad and disponible. |
| Gestor de Pedidos | `PEDIDOS` | View all orders, advance states CONFIRMADO → ENTREGADO. |
| Cliente | `CLIENT` | View catalog, manage cart, create orders, view own orders only. |

## Seed Data — Mandatory

`app/db/seed.py` must run after `alembic upgrade head`. Without it, the app doesn't work.

| Entity | Records |
|--------|---------|
| Rol | ADMIN, STOCK, PEDIDOS, CLIENT |
| EstadoPedido | PENDIENTE, CONFIRMADO, EN_PREP, EN_CAMINO, ENTREGADO, CANCELADO (with es_terminal) |
| FormaPago | MERCADOPAGO, EFECTIVO, TRANSFERENCIA (all habilitado=true) |
| Admin user | admin@foodstore.com / Admin1234! with ADMIN role |

## Existing Infrastructure (already implemented)

These files exist in `app/core/` from change `infra-backend-core` (archived):

| File | What it does | DO NOT recreate |
|------|-------------|-----------------|
| `main.py` | App factory `create_app()`, lifespan, middleware registration |  ✓ |
| `config.py` | Settings with pydantic-settings, SECRET_KEY validation, CORS parsing | ✓ |
| `errors.py` | RFC 7807 exception handlers for all error types | ✓ |
| `exceptions.py` | Domain exceptions (AppError, NotFoundError, ConflictError, etc.) | ✓ |
| `middleware.py` | BodySizeLimitMiddleware (413 Payload Too Large) | ✓ |
| `rate_limit.py` | slowapi Limiter singleton + 429 handler with Retry-After | ✓ |
| `schemas.py` | Base schemas | ✓ |
| `logging.py` | Logging configuration | ✓ |
| `api/v1/health.py` | GET /api/v1/health (no DB dependency) | ✓ |

## Code Conventions

- Python: `snake_case` for variables, functions, modules
- Classes: `PascalCase`
- Functions: < 50 lines, single responsibility
- Docstrings on all public functions explaining WHY, not just WHAT
- Domain exceptions from `core/exceptions.py` — never raw `HTTPException` in services
- `async def` for all route handlers and service methods
