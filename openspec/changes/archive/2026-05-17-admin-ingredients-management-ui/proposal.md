## Why

El backend ya soporta CRUD de ingredientes y los documentos del proyecto lo exigen para `ADMIN` y `STOCK`, pero la web solo muestra los ingredientes existentes al crear o editar productos. En la practica, el usuario queda limitado a los datos de seed y no puede administrar ingredientes desde el panel.

## What Changes

- Agregar una vista administrativa `/admin/ingredientes` para listar, crear, editar y eliminar ingredientes.
- Exponer la vista para roles `ADMIN` y `STOCK`, alineada con el contrato backend vigente.
- Usar paginacion real del backend en vez de traer todos los ingredientes de una.
- Agregar busqueda textual por nombre mediante query param `q` en `GET /api/v1/ingredientes`.
- Mantener filtro por alergeno y permitir combinarlo con busqueda/paginacion.
- Crear API client, hooks TanStack Query y tipos frontend dedicados para ingredientes.
- Agregar acceso desde la navegacion de administracion/stock.
- Invalidar caches relacionadas para que los ingredientes creados o editados esten disponibles al asociarlos a productos.

## Scope

- **Backend**: extender listado de ingredientes con busqueda `q` case-insensitive, repository/service/router/tests.
- **Frontend**: nueva pagina CRUD, rutas, navegacion, hooks, API client y UX de paginado/busqueda.
- **OpenSpec/docs**: documentar el contrato y actualizar el mapa de changes.

## Non-Goals

- Crear ingredientes inline dentro del formulario de producto.
- Cambiar el modelo de datos de ingredientes.
- Cambiar reglas de personalizacion/exclusion de ingredientes en carrito o pedidos.
- Cambiar seed de ingredientes.
- Resolver reutilizacion de nombres de ingredientes soft-deleted; queda fuera salvo decision explicita posterior.

## Impact

- `ADMIN` y `STOCK` podran mantener ingredientes desde la web.
- El formulario de productos seguira asociando ingredientes existentes, pero ya no dependera solo de seed.
- El listado podra escalar mejor gracias a paginacion y busqueda del lado backend.
