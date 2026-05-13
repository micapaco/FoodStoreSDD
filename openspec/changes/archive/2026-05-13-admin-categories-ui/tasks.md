## 1. Types And API

- [x] 1.1 Extender `entities/categorias/types.ts` con `CategoriaCreate`, `CategoriaUpdate`, `CategoriaListResponse`.
- [x] 1.2 Crear `shared/api/categorias.ts` con list/tree/create/update/delete.
- [x] 1.3 Mantener compatibilidad con el contrato backend actual (`parent_id`).

## 2. Hooks

- [x] 2.1 Crear hooks TanStack Query para listar y obtener arbol.
- [x] 2.2 Crear mutations para crear, editar y eliminar.
- [x] 2.3 Invalidar queries de categorias y productos tras mutaciones.

## 3. UI

- [x] 3.1 Reemplazar placeholder de `CategoriesAdminPage`.
- [x] 3.2 Mostrar lista de categorias con nombre, padre y fecha de actualizacion.
- [x] 3.3 Mostrar formulario de crear/editar con selector de padre.
- [x] 3.4 Agregar estados loading, empty y error.
- [x] 3.5 Agregar confirmacion antes de eliminar.
- [x] 3.6 Mostrar toasts de exito/error.

## 4. Verification

- [x] 4.1 Ejecutar `npm.cmd run build`.
- [x] 4.2 Ejecutar `npm.cmd run lint`.
- [x] 4.3 Probar CRUD basico contra backend local.
- [x] 4.4 Validar OpenSpec del change en modo estricto.
