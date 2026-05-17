## Context

`GET /api/v1/ingredientes` ya retorna `IngredienteList` con `{ items, total, page, size, pages }` y acepta `alergeno`. Los endpoints protegidos `POST`, `PUT` y `DELETE` ya existen para `ADMIN` y `STOCK`.

El frontend actualmente solo tiene `getIngredientesList()` dentro de `shared/api/productos.ts`, usado como helper para el formulario de productos. No hay ruta, pagina ni hooks CRUD dedicados para ingredientes.

## Decisions

### 1. Gestion dedicada, no inline en productos

Se agrega una pagina `/admin/ingredientes`. El formulario de productos mantiene su responsabilidad: asociar ingredientes ya existentes y marcar `es_removible`.

Motivo: evita mezclar el alta de catalogo base con el formulario de producto, mantiene componentes mas simples y respeta la separacion por recurso del panel.

### 2. Busqueda backend con `q`

El listado incorporara `q?: string` en `GET /api/v1/ingredientes`.

Reglas:
- `q` filtra por `nombre` con coincidencia parcial case-insensitive.
- `q` ignora espacios extremos.
- Si `q` queda vacio, se comporta como listado normal.
- `q` se combina con `alergeno`, `page` y `size`.
- `total` y `pages` reflejan el resultado filtrado.

### 3. Frontend con TanStack Query

Crear un modulo dedicado:

- `frontend/src/shared/api/ingredientes.ts`
- `frontend/src/entities/ingredientes/types.ts`
- `frontend/src/features/ingredientes/hooks/useIngredientes.ts`
- `frontend/src/pages/admin/IngredientsAdminPage.tsx`

Query keys jerarquicas:

- `['ingredientes', 'list', filters]`
- `['ingredientes', 'detail', id]` si se necesitara detalle

Mutations invalidan `['ingredientes']` y, si corresponde, queries de productos/formularios que dependan del listado.

### 4. UX de administracion

La pagina debera incluir:

- tabla o lista densa con nombre, estado alergeno y acciones;
- buscador por nombre;
- filtro de alergeno;
- paginacion con `page` y `size`;
- modal o formulario consistente para crear/editar;
- confirmacion antes de soft-delete;
- errores HTTP legibles para duplicados, permisos y validacion.

### 5. Navegacion y permisos

Agregar ruta bajo `RoleRoute roles={['ADMIN', 'STOCK']}`.

Agregar link:
- ADMIN: `Ingredientes` dentro del menu admin.
- STOCK: `Ingredientes` junto a `Productos`.

## Risks

- El formulario de productos usa actualmente un helper que trae ingredientes sin filtros. Al introducir modulo dedicado, se debe evitar duplicar fuentes de verdad.
- Si hay muchos ingredientes y el formulario de productos sigue necesitando todos para asociacion, podria requerir una UX de busqueda/asociacion posterior. Este change solo evita traer todos en la pagina administrativa.
- La unicidad actual incluye soft-deleted en backend; si se quiere cambiar esa regla como categorias, requiere migracion/decision separada.

## Verification

- Tests backend del listado con `q`, `alergeno`, paginacion y combinaciones.
- Build/lint frontend.
- Prueba manual con ADMIN y STOCK: crear, buscar, editar y eliminar.
- Prueba manual de producto: ingrediente creado aparece disponible para asociar despues de invalidar/refrescar.
