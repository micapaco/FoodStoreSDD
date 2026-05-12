## 1. Preparation And Contract

- [x] 1.1 Validar el change `order-views` con OpenSpec y ajustar inconsistencias de artefactos.
- [x] 1.2 Revisar `pedidos-api`, `pedidos-frontend`, `Historias_de_usuario.txt` y `Integrador.txt` antes del apply.
- [x] 1.3 Confirmar el contrato final de rutas cliente/admin y los campos de resumen/detalle.

## 2. Backend Read Models And Queries

- [x] 2.1 Definir schemas de resumen paginado y detalle para pedidos propios.
- [x] 2.2 Definir schemas de resumen operativo y detalle operativo para `ADMIN`/`PEDIDOS`.
- [x] 2.3 Implementar queries paginadas de pedidos propios con filtro por estado y orden descendente.
- [x] 2.4 Implementar queries administrativas con filtros por estado, fechas y busqueda.
- [x] 2.5 Implementar lectura de detalle propio con items snapshot, direccion snapshot, historial y pago visible.
- [x] 2.6 Implementar lectura de detalle operativo con datos del cliente, historial y pago.

## 3. Backend Services And Routers

- [x] 3.1 Agregar servicios de lectura con validacion de ownership para `CLIENT`.
- [x] 3.2 Agregar servicios de lectura operativa para `ADMIN` y `PEDIDOS`.
- [x] 3.3 Exponer `GET /api/v1/pedidos`.
- [x] 3.4 Exponer `GET /api/v1/pedidos/{pedido_id}`.
- [x] 3.5 Exponer `GET /api/v1/admin/pedidos`.
- [x] 3.6 Exponer `GET /api/v1/admin/pedidos/{pedido_id}`.
- [x] 3.7 Mantener routers delgados y dependencias de permisos alineadas con AGENTS y specs.

## 4. Frontend Data Layer

- [x] 4.1 Ampliar tipos de `entities/pedidos` para listas y detalles aprobados.
- [x] 4.2 Crear hooks TanStack Query para pedidos propios y detalle propio.
- [x] 4.3 Crear hooks TanStack Query para listado y detalle operativo admin.
- [x] 4.4 Reutilizar parseo de errores y patrones de loading existentes.

## 5. Frontend Views

- [x] 5.1 Reemplazar `OrdersListPage` por una vista funcional con paginacion, filtro por estado y navegacion a detalle.
- [x] 5.2 Reemplazar `OrderDetailPage` por una vista de detalle con resumen, items, direccion, historial y pago.
- [x] 5.3 Reemplazar `OrdersAdminPage` por una vista operativa con filtros y acceso a detalle.
- [x] 5.4 Resolver estados vacios, error, loading y acceso denegado sin romper el shell actual.
- [x] 5.5 Agregar acciones operativas para avanzar estados permitidos y cancelar pedidos con motivo.

## 6. Verification

- [x] 6.1 Agregar o actualizar tests backend para ownership, filtros, paginacion y detalle operativo.
- [x] 6.2 Ejecutar validacion OpenSpec del change.
- [x] 6.3 Ejecutar verificacion backend disponible y build frontend.
- [x] 6.4 Verificar manualmente rutas `/pedidos`, `/pedidos/:id` y `/admin/pedidos`.
