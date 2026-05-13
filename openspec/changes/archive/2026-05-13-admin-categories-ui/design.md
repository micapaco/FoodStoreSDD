## Context

El backend de categorías está implementado en `app/modules/categorias/` y registrado bajo `/api/v1/categorias`. Las escrituras requieren `ADMIN` o `STOCK`, pero la ruta `/admin/categorias` está protegida solo para `ADMIN` en el router frontend actual. Mantener ese acceso admin-only es consistente con la navegación existente.

El frontend ya consume categorías para formularios de productos mediante `shared/api/productos.ts`, pero esa API solo expone listado simple para selección. La pantalla admin necesita operaciones CRUD propias y manejo de errores.

## Goals / Non-Goals

**Goals:**
- UI real para `/admin/categorias`.
- Listado plano paginado o de tamaño suficiente para administración.
- Visualización de jerarquía padre/hijo de forma escaneable.
- Crear categoría raíz o hija.
- Editar nombre y padre.
- Eliminar con modal de confirmación.
- Invalidar queries de categorías y productos tras mutaciones.

**Non-Goals:**
- Cambiar endpoints backend.
- Drag and drop para ordenar jerarquía.
- Gestión de ingredientes en esta pantalla.
- Permitir STOCK en `/admin/categorias` (quedaría para ajuste de navegación si se decide ampliar acceso).

## Decisions

### D1 - API propia de categorías

Crear `shared/api/categorias.ts` evita seguir creciendo `shared/api/productos.ts` con operaciones de otro recurso. Los formularios de producto pueden migrarse después, pero no es necesario para este change.

### D2 - Formulario compacto en la misma página

Una pantalla de administración densa es suficiente: tabla/lista + panel/formulario para crear/editar. No se necesita wizard ni página separada.

### D3 - Selector de padre con exclusión del nodo editado

Al editar una categoría, el selector de padre no debe ofrecer la propia categoría. El backend sigue siendo la fuente de verdad para anti-ciclos; el frontend solo evita errores obvios.

### D4 - Invalidación de queries compartidas

Las mutaciones invalidan `['categorias']`, `['categorias', 'tree']` y `['productos']`, porque los productos muestran nombres de categorías.

## Verification

- Build TypeScript.
- Lint.
- Crear una categoría raíz.
- Crear una subcategoría.
- Editar nombre.
- Editar padre.
- Eliminar con confirmación.
- Verificar que un CLIENT recibe 403 si intenta usar endpoints write.

