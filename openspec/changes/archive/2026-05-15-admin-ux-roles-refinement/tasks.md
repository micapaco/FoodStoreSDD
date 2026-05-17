## 1. Método de pago explícito en pedidos admin

- [x] 1.1 En `OrdersAdminPage.tsx`, agregar fila "Método de pago" en el panel de detalle mostrando `formaPagoCodigo` como texto legible ("MercadoPago" / "Efectivo" / "Transferencia") — actualmente solo aparece el estado del pago, no el método
- [x] 1.2 En la tabla de pedidos (list view), agregar subtexto bajo el total o una columna pequeña con el método de pago para identificarlo de un vistazo sin entrar al detalle

## 2. Selector de roles con combinaciones válidas

- [x] 2.1 En `UsersAdminPage.tsx`, reemplazar el array `ALL_ROLES` por opciones que incluyan la combinación `STOCK+PEDIDOS` — las opciones del selector deben ser: `ADMIN` · `STOCK` · `PEDIDOS` · `STOCK+PEDIDOS` · `CLIENT`
- [x] 2.2 Actualizar `handleSave` en el `EditModal`: cuando se seleccione `STOCK+PEDIDOS` enviar `{ roles: ['STOCK', 'PEDIDOS'] }` al backend; para los demás casos enviar `{ roles: [selectedRole] }`
- [x] 2.3 Inicializar `selectedRole` con lógica inversa: si el usuario ya tiene roles `['STOCK', 'PEDIDOS']` (en cualquier orden), mostrar `STOCK+PEDIDOS` como valor seleccionado en el modal

## 3. Eliminar link "Inicio" duplicado del nav público

- [x] 3.1 Eliminar el `NavLink` a `/` con label "Inicio" del nav **desktop** en `PublicHeader.tsx` — `HomePage` es un wrapper de `CatalogoPage`, el único link de catálogo debe ser "Catálogo" → `/productos`
- [x] 3.2 Eliminar el `NavLink` a `/` con label "Inicio" del nav **mobile** en `PublicHeader.tsx` — mismo motivo

## 4. Sidebar vertical + refactor completo del dashboard admin con skills

> Aplicar AMBAS skills: `dashboard-crud-page` (estructura de páginas, Zustand sin destructuring, useMemo para datos derivados, skeletons de carga, patrones de formulario) + `tailwind-design-system` (adaptado a Tailwind v3 — `tailwind.config.ts` con `extend`, no `@theme`). Leer las skills antes de tocar cualquier página.

### 4a. Layout — Sidebar
- [x] 4.1 Crear `frontend/src/widgets/nav/AdminSidebar.tsx` — sidebar fixed izquierdo con: logo "Food Store", nav items según rol, botón "Ver como cliente" solo para ADMIN (navega a `/productos`), toggle hamburguesa mobile
- [x] 4.2 Agregar `sidebarOpen: boolean` + `setSidebarOpen` en `uiStore` (Zustand) — acceder siempre con selector, nunca destructuring del store
- [x] 4.3 Actualizar `PrivateLayout.tsx` — reemplazar `<RoleNav>` por `<AdminSidebar>`, ajustar contenido con `ml-64` desktop / `ml-0` mobile
- [x] 4.4 Retirar `<RoleNav>` del layout — preservar el archivo por si se reutiliza

### 4b. Páginas admin — aplicar patrones dashboard-crud-page
- [x] 4.5 `AdminDashboardPage.tsx` — aplicar skeleton de carga para KPI cards, useMemo para métricas derivadas del rango de fecha, Zustand selectors sin destructuring
- [x] 4.6 `OrdersAdminPage.tsx` — aplicar skeleton de tabla mientras carga, useMemo para lista filtrada/ordenada, acceso a store con selectores
- [x] 4.7 `ProductsAdminPage.tsx` — placeholder sin change implementado; no hay hooks de productos disponibles, se omite hasta el change admin-products
- [x] 4.8 `UsersAdminPage.tsx` — aplicar skeleton de tabla, useMemo para lista filtrada, Zustand selectors (el modal de edición ya está implementado en tarea 2)
- [x] 4.9 `CategoriesAdminPage.tsx` — aplicar mismo patrón que ProductsAdminPage: modal state, confirmación delete, paginación useMemo, skeleton
- [x] 4.10 `SystemConfigPage.tsx` — aplicar patrón de formulario con estado de carga/guardado consistente con el resto del dashboard
