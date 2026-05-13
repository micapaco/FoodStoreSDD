## Why

La ruta `/admin/categorias` existe en el shell y aparece en la navegación admin, pero hoy muestra un placeholder. Esto deja incompleta la administración del catálogo: el backend ya expone CRUD de categorías, pero el Admin no puede gestionarlas desde la UI.

## What Changes

- Reemplazar `CategoriesAdminPage` placeholder por una pantalla funcional de administración de categorías.
- Consumir el contrato backend existente:
  - `GET /api/v1/categorias`
  - `GET /api/v1/categorias/arbol`
  - `POST /api/v1/categorias`
  - `PUT /api/v1/categorias/{id}`
  - `DELETE /api/v1/categorias/{id}`
- Agregar API functions, hooks TanStack Query y tipos request para create/update.
- Permitir crear, editar nombre/padre y eliminar categorías con confirmación.
- Mostrar estados de carga, vacío, error y feedback vía toast.

## Scope

Frontend only. No se cambia contrato API ni lógica backend.

## Impact

- **Frontend**: `CategoriesAdminPage`, `shared/api/categorias.ts`, hooks de categorías, tipos adicionales.
- **Backend**: sin cambios.
- **OpenSpec**: nueva capability `admin-categorias-frontend`.

