## 1. Auditoria previa

- [x] 1.1 Confirmar contrato actual de `GET/POST/PUT/DELETE /api/v1/ingredientes`.
- [x] 1.2 Confirmar paginas admin existentes para reutilizar patrones visuales y de permisos.
- [x] 1.3 Confirmar como `ProductoForm.tsx` consume ingredientes para no duplicar helpers.

## 2. Backend ingredientes

- [x] 2.1 Agregar parametro opcional `q` a `GET /api/v1/ingredientes`.
- [x] 2.2 Implementar busqueda case-insensitive por `nombre` en repository/service.
- [x] 2.3 Mantener combinacion con `alergeno`, `page` y `size`.
- [x] 2.4 Asegurar que `total` y `pages` respetan los filtros activos.
- [x] 2.5 Agregar tests backend para busqueda, paginacion y filtro combinado.

## 3. Frontend API y hooks

- [x] 3.1 Crear `shared/api/ingredientes.ts` con list/create/update/delete.
- [x] 3.2 Completar tipos de `entities/ingredientes/types.ts`.
- [x] 3.3 Crear hooks TanStack Query para listado paginado y mutaciones.
- [x] 3.4 Migrar o reutilizar el helper de ingredientes usado por productos para evitar duplicacion inconsistente.

## 4. Frontend UI

- [x] 4.1 Crear `IngredientsAdminPage.tsx`.
- [x] 4.2 Agregar ruta `/admin/ingredientes` para `ADMIN` y `STOCK`.
- [x] 4.3 Agregar link de navegacion para `ADMIN` y `STOCK`.
- [x] 4.4 Implementar buscador por nombre con estado en URL o estado local estable.
- [x] 4.5 Implementar filtro por alergeno.
- [x] 4.6 Implementar paginacion real contra backend.
- [x] 4.7 Implementar crear/editar ingrediente con validacion y errores claros.
- [x] 4.8 Implementar soft-delete con confirmacion.
- [x] 4.9 Asegurar que despues de crear/editar/eliminar se invalidan caches de ingredientes.
- [x] 4.10 Agregar buscador y paginado al selector de ingredientes del formulario de producto.

## 5. Validacion

- [x] 5.1 Ejecutar tests backend relevantes.
- [x] 5.2 Ejecutar lint/build frontend.
- [x] 5.3 Validar OpenSpec del change en strict.
- [x] 5.4 Prueba manual ADMIN: crear, buscar, editar y eliminar ingrediente.
- [x] 5.5 Prueba manual STOCK: acceder a ingredientes y operar CRUD.
- [x] 5.6 Prueba manual producto: ingrediente nuevo queda disponible para asociar.
