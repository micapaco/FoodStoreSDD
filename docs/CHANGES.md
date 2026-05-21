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

### `15.5` — `offline-payment-order-flow`

**Funcionalidad**: Cierre contractual del flujo de pagos offline.
Formaliza como se validan operativamente pedidos con `EFECTIVO` o `TRANSFERENCIA`, manteniendo `CONFIRMADO` como estado asociado a pago validado y definiendo una accion dedicada para que `ADMIN`/`PEDIDOS` confirmen esos pedidos sin romper la FSM vigente.

**Historias de usuario**: Ajuste correctivo sobre US-035, US-039, US-043, US-051, US-052 y US-065  
**Depende de**: `order-fsm`, `order-views`

> Este change corrige una regla de contrato incompleta: las formas de pago offline existian desde infraestructura, pero el flujo archivado solo resolvia confirmacion automatica por MercadoPago.

---

### `15.6` — `pickup-fulfillment-flow`

**Funcionalidad**: Cierre contractual del flujo de retiro en local.
Formaliza que los pedidos con `direccion_id=NULL` no deben cobrar envio y deben recorrer una variante operativa coherente con retiro en local, evitando pasos de despacho que solo aplican a entrega a domicilio.

**Historias de usuario**: Ajuste correctivo sobre US-035, US-041, US-042, US-051, US-052 y US-071  
**Depende de**: `order-creation`, `order-fsm`, `order-views`, `offline-payment-order-flow`

> Este change corrige una inconsistencia entre una regla ya documentada (`NULL = retiro en local`) y contratos heredados que seguian aplicando costo de envio fijo y la transicion `EN_PREP -> EN_CAMINO` para todos los pedidos.

---

### `16` — `order-feedback`

**Funcionalidad**: Feedback UX post-checkout.
Pantalla de confirmación de pedido creado, resumen de compra, redirecciones y estados visuales después de la creación del pedido.

**Historias de usuario**: US-071  
**Depende de**: `order-creation`, `offline-payment-order-flow`, `pickup-fulfillment-flow`

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

### `20` — `catalog-timestamp-hotfix`

**Funcionalidad**: Normalización de timestamps en el catálogo.
Corrección de defaults de `updated_at` en modelos de categorías e ingredientes, asignación correcta en el servicio de actualización y soft delete genérico. Fix puntual de regresión en PostgreSQL local.

**Historias de usuario**: Corrección técnica transversal a US-007 a US-014  
**Depende de**: `catalog-categories-ingredients`, `catalog-products`

> Hotfix de backend. No agrega funcionalidad de dominio; corrige comportamiento incorrecto de timestamps que afectaba las respuestas del catálogo en entornos locales.

---

### `21` — `frontend-runtime-stabilization`

**Funcionalidad**: Estabilización del runtime del frontend.
Fallback de `VITE_API_BASE_URL` a `/api/v1`, normalización de `roles` en `authStore` (siempre `string[]`), helper `getSafeUserRoles`, helper `resolvePostLoginPath` para redirects post-login seguros, corrección de tipos en `AdminDashboardPage` y suscripción no usada en checkout.

**Historias de usuario**: Correctivo transversal a US-000c, US-066, US-067  
**Depende de**: `frontend-shell`, `auth`

> Estabilización operativa del cliente HTTP y del store de autenticación. Sin este change el runtime fallaba silenciosamente en entornos sin `VITE_API_BASE_URL` configurado y con usuarios que tenían `roles` en formato inconsistente.

---

### `22` — `admin-categories-ui`

**Funcionalidad**: Panel admin de categorías (frontend completo).
Tipos y API client para categorías (`CategoriaCreate`, `CategoriaUpdate`), hooks TanStack Query para árbol y lista, mutations con invalidación, página `CategoriesAdminPage` con CRUD completo, selector de categoría padre, confirmación de eliminación y estados de carga/vacío/error.

**Historias de usuario**: US-007 a US-014 (frontend admin)  
**Depende de**: `catalog-categories-ingredients`, `frontend-shell`, `frontend-runtime-stabilization`

> El change `catalog-categories-ingredients` implementó el backend. Este change implementa la UI admin que faltaba para operar el CRUD desde el dashboard.

---

### `23` — `single-role-and-client-cart-hotfix`

**Funcionalidad**: Rol único por usuario + carrito exclusivo de clientes.
Enforcement de exactamente un rol por usuario en backend (schema y servicio), UI de asignación de roles cambia de multi-checkbox a selector único, carrito (`CartDrawer`, header) oculto para roles que no sean `CLIENT`.

**Historias de usuario**: Correctivo sobre US-004, US-005, US-029 a US-034  
**Depende de**: `auth`, `frontend-shell`, `admin-users`, `cart`

> Hotfix cross-domain. La especificación establece un solo rol activo por usuario; el sistema original permitía múltiples. El carrito tampoco debía mostrarse a roles operativos (ADMIN, STOCK, PEDIDOS).

---

### `24` — `stitch-visual-redesign`

**Funcionalidad**: Rediseño visual completo con design system Stitch.
Actualización de `tailwind.config.js` con tokens de color (`brand`, `ink`, `surface-*`, `line-*`), tipografía y sombras extraídos de Stitch. Restyleo de `Button.tsx`, `Badge.tsx`, `Input.tsx`, `Card.tsx` en `shared/ui/`. Restyleo de todas las páginas públicas, admin y widgets (header, footer, nav, toaster) con los tokens del nuevo tema.

**Historias de usuario**: Mejora visual transversal (no mapea a historias de dominio)  
**Depende de**: `frontend-shell`, `frontend-runtime-stabilization`

> Change puramente visual. No modifica lógica, stores, hooks ni contratos API. Todo el trabajo está en clases Tailwind y estructura HTML de los componentes existentes.

---

### `25` — `product-image-url`

**Funcionalidad**: Imágenes de productos end-to-end.
Campo `imagen_url VARCHAR(500) NULL` en el modelo `Producto` (migración Alembic), schemas y servicio backend actualizados, tipos frontend extendidos, formulario admin con campo URL + preview en tiempo real, catálogo público y detalle público mostrando imagen real o placeholder SVG, detalle admin con sección de imagen, y correcciones UX en inputs numéricos del formulario.

**Historias de usuario**: US-015 a US-018 (extensión de imagen), US-021, US-023  
**Depende de**: `catalog-products`, `stitch-visual-redesign`

> Extensión de una entidad ya existente. El campo es nullable; todos los endpoints existentes mantienen su contrato agregando `imagen_url` como campo opcional en request y garantizado (puede ser `null`) en response.

---

### `26` — `admin-ux-roles-refinement`

**Funcionalidad**: Refinamientos UX del panel admin.
Método de pago visible en detalle y lista de pedidos admin, selector de roles con combinación `STOCK+PEDIDOS`, eliminación del link "Inicio" duplicado en la nav pública, sidebar vertical fixed para el dashboard admin (`AdminSidebar.tsx`) con toggle mobile, patrones de skeleton y `useMemo` aplicados en todas las páginas admin.

**Historias de usuario**: Refinamiento sobre US-051, US-052, US-053, US-054, US-055, US-065  
**Depende de**: `admin-users`, `order-views`, `stitch-visual-redesign`

> Change activo al momento de agregar este registro. Mejoras UX que no implican cambios de contrato ni de lógica de negocio; todo el trabajo es en la capa de presentación del dashboard.

---

### `27` — `display-cocina`

**Funcionalidad**: Kitchen Display System (KDS) + rol Cocinero.
Nuevo rol `COCINA` en el RBAC, pantalla en tiempo real (`/cocina`) con dos columnas por estado (`CONFIRMADO` / `EN_PREP`), WebSocket push con fallback polling REST, timer de urgencia visual, alerta sonora opcional y autorización de las transiciones `CONFIRMADO → EN_PREP → EN_CAMINO` para el nuevo rol.

**Historias de usuario**: US-COCINA-01 a US-COCINA-09  
**Depende de**: `auth`, `payment-integration`, `order-fsm`, `frontend-shell`

> Este change agrega infraestructura nueva al backend (WebSocket single-instance con pub/sub en proceso) sin modificar el FSM ni sus estados. El rol `COCINA` se incorpora en paralelo a `PEDIDOS`, sin reemplazarlo. El material de dominio vive en `feature-display-cocina/`. Ver `feature-display-cocina/README.md` para decisiones de diseño cerradas (WebSocket vs SSE, single vs multi-instancia, PA-CO-01).

---

## Árbol de dependencias

```text
infra-backend-core ────────┐
                           ├── infra-database ──┐
infra-frontend-core ───────┘                    │
                                                ├── auth ──────────────────────────────────────────┐
                                                │                      ├── profile                  │
                                                │                      ├── catalog-categories-ingredients ── catalog-products ──┐
                                                │                      ├── addresses                │                            │
                                                │                      ├── admin-users              │                            │
                                                │                      └── system-config            │                            │
                                                │                                                   │                            │
                                                └── frontend-shell ──────┬── catalog-products       │                            │
                                                                         ├── addresses              │                            │
                                                                         ├── order-views            │                            │
                                                                         └── admin-users            │                            │

catalog-categories-ingredients ─────────────────────────────────────────────────────────────────────┤
                                                                                                     ├── catalog-timestamp-hotfix
catalog-products ────────────────────────────────────────────────────────────────────────────────────┘

frontend-shell ─────────────────────────┐
                                        ├── frontend-runtime-stabilization ── admin-categories-ui
auth ───────────────────────────────────┘

auth + frontend-shell + admin-users + cart ────── single-role-and-client-cart-hotfix

frontend-shell + frontend-runtime-stabilization ── stitch-visual-redesign ── product-image-url

admin-users + order-views + stitch-visual-redesign ── admin-ux-roles-refinement

catalog-products ───────────────┐
                                ├── cart ───────────────┐
addresses ──────────────────────┘                       │
                                                        ├── checkout-validation ── order-creation ──┐
catalog-products ───────────────────────────────────────┘                                             ├── payment-integration ──┬── order-fsm ── order-views ── admin-metrics
                                                                                                      └── order-feedback        │
                                                                                                                                └── display-cocina
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
