# Mapa de Changes — Food Store

> Reescrito a partir de `docs/Descripcion.txt`, `docs/Integrador.txt` y `docs/Historias_de_usuario.txt`.
> Este mapa busca que cada change sea **proponible, diseñable, aplicable y archivabile** sin mezclar demasiadas responsabilidades.
> Cada change debe producir sus artefactos en `openspec/changes/<nombre>/`: `proposal.md`, `design.md`, `tasks.md`.

---

## Criterios de este mapa

- **Un change = una unidad de valor coherente**, no un megapack de medio sistema.
- **Las dependencias siguen las historias reales**, no solo intuición técnica.
- **Se separan shell/base frontend, perfil, validaciones pre-checkout, feedback UX y administración**, porque en las historias aparecen como bloques propios.
- **Cross-domain no justifica mezclar todo**: si una feature atraviesa backend y frontend pero representa una sola capacidad clara, se mantiene en un mismo change.

---

## Changes del proyecto

### `01` — `infra-backend-core`

**Funcionalidad**: Base operativa del backend FastAPI.
Incluye `main.py`, configuración por entorno, CORS, middleware global, manejo de errores RFC 7807, rate limiting con `slowapi`, sanitización/validación transversal y registro inicial de routers con prefijo `/api/v1`.

**Historias de usuario**: US-000a, US-068, US-074  
**Depende de**: —

> Este change crea el esqueleto ejecutable del backend, pero todavía no define el modelo completo de datos ni la infraestructura transaccional avanzada.

---

### `02` — `infra-database`

**Funcionalidad**: Base de datos, persistencia y patrones de acceso.
Incluye `docker-compose.yml` con el servicio PostgreSQL (imagen oficial, volumen persistente, variables de entorno), SQLModel, Alembic, migración inicial completa del ERD v5, seed idempotente, `BaseRepository[T]`, `UnitOfWork`, dependencias de sesión y catálogos base (`Rol`, `EstadoPedido`, `FormaPago`). Actualiza `.env.example` con `DATABASE_URL` en formato `postgresql+asyncpg://`.

**Historias de usuario**: US-000b, US-000d  
**Depende de**: `infra-backend-core`

> Se separa de `infra-backend-core` para que el modelo de datos y la infraestructura transaccional puedan diseñarse y revisarse aparte. Docker levanta la base local sin instalar PostgreSQL en la máquina.

---

### `03` — `infra-frontend-core`

**Funcionalidad**: Base operativa del frontend.
Incluye Vite + React + TypeScript, Tailwind CSS, React Router, TanStack Query, Axios, TanStack Form, configuración base de providers y estructura Feature-Sliced Design.

**Historias de usuario**: US-000c  
**Depende de**: —

> Este change deja listo el casco del frontend, pero no resuelve todavía navegación por rol, refresh automático ni stores completos.

---

### `04` — `frontend-shell`

**Funcionalidad**: Shell transversal del frontend.
Incluye navegación por rol, protección de rutas, manejo de token expirado con refresh automático, manejo global de errores HTTP, layout base y stores Zustand de sesión/UI necesarios para sostener la app.

**Historias de usuario**: US-000e, US-066, US-067, US-075, US-076  
**Depende de**: `infra-frontend-core`, `auth`

> Este bloque estaba difuso en el mapa anterior. Se vuelve explícito porque sin shell no hay experiencia coherente de navegación ni protección real del frontend.

---

### `05` — `auth`

**Funcionalidad**: Autenticación y autorización full stack.
Registro, login, refresh con rotación, logout, `GET /auth/me`, JWT access/refresh, RBAC, invalidación segura de refresh tokens y protecciones por rol.

**Historias de usuario**: US-001, US-002, US-003, US-004, US-005, US-006, US-073  
**Depende de**: `infra-backend-core`, `infra-database`, `infra-frontend-core`

> Sigue siendo la primera feature funcional real del sistema: sin auth no hay ownership, roles ni rutas protegidas.

---

### `06` — `profile`

**Funcionalidad**: Perfil del cliente.
Ver perfil propio, editar datos personales y cambiar contraseña con validaciones correspondientes.

**Historias de usuario**: US-061, US-062, US-063  
**Depende de**: `auth`, `frontend-shell`

> Se extrae como change propio porque en las historias forma una épica independiente y no pertenece al dominio de pedidos.

---

### `07` — `catalog-categories-ingredients`

**Funcionalidad**: Gestión de categorías, ingredientes y alérgenos.
CRUD de categorías jerárquicas con validación anti-ciclos, soft delete seguro, CRUD de ingredientes, flag `es_alergeno` y base para relaciones producto-categoría / producto-ingrediente.

**Historias de usuario**: US-007 a US-014  
**Depende de**: `auth`

> Se agrupan categorías e ingredientes porque en el dominio del catálogo están fuertemente acoplados y ambos preceden a productos.

---

### `08` — `catalog-products`

**Funcionalidad**: Productos, stock y catálogo público.
CRUD de productos, relaciones con categorías e ingredientes, stock, disponibilidad, detalle público, filtros, paginación, búsqueda y gestión por roles `ADMIN`/`STOCK`.

**Historias de usuario**: US-015 a US-023, US-064  
**Depende de**: `catalog-categories-ingredients`, `frontend-shell`

> Se absorbe `US-064` porque “catálogo admin” no es una capability aparte: es extensión de permisos sobre el mismo dominio de catálogo.

---

### `09` — `addresses`

**Funcionalidad**: Direcciones de entrega.
CRUD por usuario, ownership, dirección principal y selector utilizable en checkout.

**Historias de usuario**: US-024 a US-028  
**Depende de**: `auth`, `frontend-shell`

> Permite resolver correctamente snapshots de dirección y checkout sin mezclarlo con pedidos todavía.

---

### `10` — `cart`

**Funcionalidad**: Carrito client-side.
Stores Zustand del carrito, persistencia en localStorage, personalización por exclusión de ingredientes, drawer/resumen y reglas client-side del carrito.

**Historias de usuario**: US-029 a US-034  
**Depende de**: `catalog-products`, `frontend-shell`

> Se mantiene frontend-only porque las historias y reglas de negocio dicen explícitamente que el carrito no existe en backend.

---

### `11` — `checkout-validation`

**Funcionalidad**: Validaciones previas al checkout.
Chequeo de disponibilidad y stock vigente, verificación de cambios de precio, respuesta al cliente ante diferencias entre carrito persistido y estado actual del backend.

**Historias de usuario**: US-069, US-070  
**Depende de**: `cart`, `catalog-products`, `addresses`

> Este bloque merece change propio porque en las historias aparece como épica separada entre carrito y creación de pedido.

---

### `12` — `order-creation`

**Funcionalidad**: Creación atómica de pedidos.
Validaciones dentro del UoW, snapshots de precio y dirección, cálculo de totales, `Pedido` + `DetallePedido` + `HistorialEstadoPedido` inicial y flujo de checkout para crear el pedido.

**Historias de usuario**: US-035 a US-038  
**Depende de**: `checkout-validation`, `addresses`, `cart`

> El requisito dominante acá es la atomicidad y los snapshots, no todavía el ciclo de vida completo del pedido.

---

### `13` — `payment-integration`

**Funcionalidad**: Integración MercadoPago.
Creación del pago/preferencia, idempotency key, webhook/IPN, consulta de estado real en MercadoPago, retorno del cliente y persistencia de intentos de pago.

**Historias de usuario**: US-045 a US-048, US-072  
**Depende de**: `order-creation`

> Se incorpora `US-072` porque el retorno/feedback de pago pertenece naturalmente al flujo de pagos, no a un bloque UX genérico.

---

### `14` — `order-fsm`

**Funcionalidad**: FSM del pedido e historial append-only.
Confirmación automática por pago aprobado, avance manual de estados, cancelación con restauración de stock, historial cronológico y reglas terminales.

**Historias de usuario**: US-039 a US-044  
**Depende de**: `order-creation`, `payment-integration`

> La dependencia sobre pagos es real: según las historias, `PENDIENTE → CONFIRMADO` ocurre por aprobación de pago.

---

### `15` — `order-views`

**Funcionalidad**: Visualización y gestión operativa de pedidos.
Listado y detalle de pedidos propios, panel de pedidos para `PEDIDOS`/`ADMIN`, historial visible, timeline y detalle operativo completo.

**Historias de usuario**: US-049, US-050, US-051, US-052, US-065  
**Depende de**: `order-fsm`, `frontend-shell`

> Se absorbe `US-065` porque “control total sobre pedidos” es extensión de permisos del mismo dominio de vistas/gestión de pedidos, no un admin-panel separado.

---

### `16` — `order-feedback`

**Funcionalidad**: Feedback UX post-checkout.
Pantalla de confirmación de pedido creado, resumen de compra, redirecciones y estados visuales después de la creación del pedido.

**Historias de usuario**: US-071  
**Depende de**: `order-creation`

> Se separa porque es UX específica del momento post-creación y no debe perderse dentro de pedidos o pagos.

---

### `17` — `admin-users`

**Funcionalidad**: Administración de usuarios.
Listado, edición, roles, activación/desactivación y reglas para no degradar al último administrador.

**Historias de usuario**: US-053, US-054, US-055  
**Depende de**: `auth`, `frontend-shell`

> Este bloque tiene identidad propia en las historias y no conviene mezclarlo con métricas ni catálogo.

---

### `18` — `admin-metrics`

**Funcionalidad**: Dashboard y métricas administrativas.
KPIs, evolución de ventas, top productos, pedidos por estado y visualizaciones con `recharts`.

**Historias de usuario**: US-056, US-057, US-058, US-059  
**Depende de**: `order-views`, `catalog-products`

> Se separa del resto del admin porque sus dependencias, diseño y queries analíticas son distintas.

---

### `19` — `system-config`

**Funcionalidad**: Configuración general del sistema.
Panel y backend para parámetros operativos globales administrables sin tocar código.

**Historias de usuario**: US-060  
**Depende de**: `auth`, `frontend-shell`

> Aunque sea de prioridad baja, merece un change separado porque no comparte el mismo foco que usuarios, catálogo o métricas.

---

## Árbol de dependencias

```text
infra-backend-core ────────┐
                           ├── infra-database ──┐
infra-frontend-core ───────┘                    │
                                                ├── auth ─────────────┐
                                                │                      ├── profile
                                                │                      ├── catalog-categories-ingredients ── catalog-products
                                                │                      ├── addresses
                                                │                      ├── admin-users
                                                │                      └── system-config
                                                │
                                                └── frontend-shell ────┬── catalog-products
                                                                       ├── addresses
                                                                       ├── order-views
                                                                       └── admin-users

catalog-products ───────────────┐
                                ├── cart ───────────────┐
addresses ──────────────────────┘                       │
                                                        ├── checkout-validation ── order-creation ──┐
catalog-products ───────────────────────────────────────┘                                             ├── payment-integration ── order-fsm ── order-views ── admin-metrics
                                                                                                      └── order-feedback

catalog-products ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Reglas del flujo

- **Nunca implementes sin artefactos.** Si no existen `proposal.md` y `design.md` aprobados, no hay `/opsx:apply`.
- **No mezclar changes por comodidad.** Si una historia pertenece a otro dominio/epic, se mueve; no se “aprovecha el viaje”.
- **El orden importa.** Si un change depende de otro, el anterior debe estar cerrado o suficientemente consolidado antes de aplicar el siguiente.
- **Las specs son código.** Se versionan, se revisan y evolucionan junto con el proyecto.
- **El ERD v5 y las reglas de negocio son la verdad.** Si un change las contradice, está mal planteado.

---

## Justificación de esta reescritura

### 1. Se partieron los megachanges
El mapa original concentraba demasiada responsabilidad en:

- `infra-backend`
- `admin-panel`

Eso complica `propose`, `design`, `tasks`, revisión y aplicación. Ahora los bloques son más chicos y defendibles.

### 2. Se recuperaron épicas que estaban invisibles o mal absorbidas
En las historias existen bloques claros que el mapa anterior dejaba difusos:

- navegación/layout base (`US-066`, `US-067`, `US-075`, `US-076`)
- perfil (`US-061`, `US-062`, `US-063`)
- validaciones pre-checkout (`US-069`, `US-070`)
- feedback UX (`US-071`)
- configuración general (`US-060`)

Ahora todos tienen lugar explícito.

### 3. Se corrigieron ubicaciones conceptualmente incorrectas
Por ejemplo:

- `US-061` no pertenece a FSM de pedidos
- `US-072` pertenece al flujo de pagos, no a un bloque UX genérico
- `US-064` y `US-065` son extensiones de permisos sobre catálogo y pedidos, no capabilities separadas completas

### 4. El mapa queda más alineado con OPSX
OPSX funciona mejor cuando cada change:

- tiene foco claro
- tiene dependencias explícitas
- no mezcla cuatro épicas distintas en una sola propuesta

Ese fue el criterio principal de esta reescritura.
