## 1. Inspección del design system Stitch

- [x] 1.1 Leer el design system de Stitch (`mcp__stitch__get_project` + screen de Catálogo) y extraer paleta de colores primarios, neutrales y de estado
- [x] 1.2 Extraer tokens de tipografía (tamaños de fuente, pesos, line-height)
- [x] 1.3 Extraer tokens de forma (border-radius de cards, inputs, botones, modales) y sombras

## 2. Configuración de tokens en Tailwind

- [x] 2.1 Actualizar `frontend/tailwind.config.ts` con los colores primarios/brand de Stitch en `extend.colors`
- [x] 2.2 Registrar colores neutros (grays) y de estado (success, warning, danger, info) en `extend.colors`
- [x] 2.3 Registrar valores de `borderRadius` semánticos (card, button, input, modal)
- [x] 2.4 Registrar `boxShadow` (card-sm, card-md, dropdown) según el diseño Stitch
- [x] 2.5 Verificar que `content` en tailwind.config incluye todos los paths del proyecto

## 3. Componentes compartidos (shared/ui)

- [x] 3.1 Restylear `Button.tsx` — actualizar variantes CVA (primary, secondary, danger, ghost) con colores y radios de Stitch
- [x] 3.2 Restylear `Badge.tsx` — actualizar variantes de color con tokens del tema
- [x] 3.3 Crear `Input.tsx` en `shared/ui/` — input controlado con variantes (default, error) según estilo Stitch
- [x] 3.4 Crear `Card.tsx` en `shared/ui/` — contenedor con sombra, border-radius y padding según Stitch
- [x] 3.5 Crear `PageHeader.tsx` en `shared/ui/` — header de sección con título, subtítulo y slot de acciones

## 4. Layout admin — Sidebar vertical

> Implementado en change `admin-ux-roles-refinement` (tareas 4.1–4.5). El sidebar ya existirá cuando llegue el turno del restyling de Stitch — acá solo aplicar tokens visuales (colores, tipografía, sombras de Stitch) al `AdminSidebar` creado por ese change.

- [x] 4.1 Restylear `AdminSidebar.tsx` con paleta y tokens de Stitch — colores de fondo, hover states, active indicator, logo tipografía

## 5. Layout público — Navbar y footer

- [x] 5.1 Restylear `PublicHeader.tsx` — aplicar paleta, tipografía y espaciados de Stitch; verificar carrito badge y auth state
- [x] 5.2 Restylear `Footer.tsx` — aplicar estilo Stitch (colores, links, layout)
- [x] 5.3 Restylear `PublicLayout.tsx` — verificar estructura y espaciados generales

## 6. Páginas del cliente — Autenticación

- [x] 6.1 Restylear `LoginPage.tsx` — aplicar layout, card, inputs y botones de Stitch (inspeccionar `screens/e8fc17bd9dac44dfaf7e1041c8ee74a1`)
- [x] 6.2 Restylear `RegisterPage.tsx` — coherencia con LoginPage (inspeccionar `screens/30b967b2a8b64cee96543b2f9a047cff`)

## 7. Páginas del cliente — Catálogo y producto

- [x] 7.1 Restylear `CatalogoPage.tsx` — cards de productos, filtros, grid layout según Stitch (inspeccionar `screens/2e3932c2234f454b9b09fd776351ecd7`)
- [x] 7.2 Restylear `ProductoDetallePage.tsx` — imagen, precio, botón agregar, sección de descripción (inspeccionar `screens/73862a231a064a758edd752fb4e316d4`)

## 8. Páginas del cliente — Carrito y checkout

- [x] 8.1 Restylear `CartPage.tsx` / drawer de carrito — items, totales, CTA según Stitch (inspeccionar `screens/20b975834b654e659ea78c7f0a5e0a98`)
- [x] 8.2 Restylear `CheckoutPage.tsx` — formulario de entrega, resumen de orden, sección de pago (inspeccionar `screens/da6d0e2e5b074ec284b7c1d3285ce4c6`)
- [x] 8.3 Restylear `OrderConfirmationPage.tsx` — estados de pago (éxito, pendiente, error) (inspeccionar `screens/7d734f5a63c2452a8a72177d9244e857`)

## 9. Páginas del cliente — Pedidos y perfil

- [x] 9.1 Restylear `OrdersListPage.tsx` — tabla/lista de pedidos, badges de estado (inspeccionar `screens/0047e7d722574a08b94e63ec9c39d7a3`)
- [x] 9.2 Restylear `OrderDetailPage.tsx` — vista de detalle de pedido individual
- [x] 9.3 Restylear `ProfilePage.tsx` — formulario de perfil, sección de datos personales (inspeccionar `screens/0b92f0d7c8f14dbe9e9891bf6e8e9301`)
- [x] 9.4 Restylear `DireccionesPage.tsx` — lista y formulario de direcciones (inspeccionar `screens/8c49fdab60454de59b9399a6c3f49767`)

## 10. Páginas admin — Panel y métricas

- [x] 10.1 Restylear `AdminDashboardPage.tsx` — KPIs cards, gráficos recharts, layout general (inspeccionar `screens/028c6807b244430e8df2cc46d49aee3d`)
- [x] 10.2 Aplicar colores de Stitch a los gráficos recharts (líneas, barras, fill colors)

## 11. Páginas admin — Gestión operativa

- [x] 11.1 Restylear `OrdersAdminPage.tsx` — tabla de pedidos, panel de detalle, badges de estado (inspeccionar `screens/86d533b652384462a96f15b556d55f6f`)
- [x] 11.2 Restylear `ProductsAdminPage.tsx` / páginas de productos admin — tabla, formularios (inspeccionar `screens/9d8264009cda4654afe9b6803de67319`)
- [x] 11.3 Restylear `UsersAdminPage.tsx` — tabla de usuarios, modal de edición, RoleSelector (inspeccionar `screens/a573a254f43741bfbe1555e6cc1c5460`)
- [x] 11.4 Restylear `CategoriesAdminPage.tsx` — tabla de categorías, modal, pagination (inspeccionar `screens/ac3c13e4457b4385aa4a209b0d2cf4ff`)
- [x] 11.5 Restylear `SystemConfigPage.tsx` — campos de configuración, toggle, botones de guardar

## 12. Páginas de error y responsive final

- [x] 12.1 Restylear `NotFoundPage.tsx` y `ForbiddenPage.tsx` — coherentes con el design system
- [x] 12.2 Revisar responsive design en mobile (`< sm`) y tablet (`sm`–`lg`) para todas las páginas clave
- [x] 12.3 Verificar accesibilidad: contraste de colores, focus rings, aria-labels en componentes restyled
