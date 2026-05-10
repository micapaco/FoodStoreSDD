## Context

Actualmente el backend tiene el módulo `auth` implementado (login, register, refresh, perfil). No existe ningún modelo de catálogo. Las tablas `Categoria` e `Ingrediente` ya están especificadas en el ERD v5 de `docs/Integrador.txt` pero no hay código.

Se implementan dos módulos nuevos siguiendo la arquitectura feature-first existente: `app/modules/categorias/` y `app/modules/ingredientes/`. Ambos siguen el patrón `Router → Service → UoW → Repository → Model` con schemas Pydantic v2 separados.

## Goals / Non-Goals

**Goals:**
- Modelos SQLModel para `Categoria` (jerárquica, soft delete) e `Ingrediente` (soft delete, flag alérgeno)
- CRUD completo de categorías (ADMIN/STOCK) + árbol público (cualquier rol)
- CRUD completo de ingredientes (ADMIN/STOCK) + listado público
- Validación anti-ciclos al actualizar `categoria_padre_id`
- Seed de categorías base (4-5) e ingredientes comunes (8-10)
- Migration Alembic con ambas tablas

**Non-Goals:**
- Relaciones producto-categoría ni producto-ingrediente (change 08)
- Frontend de gestión de categorías/ingredientes (change 17 admin)
- Endpoints de producto ni catálogo público de productos

## Decisions

### 1. Categorías jerárquicas con CTE recursiva vs materialized path
**Decisión**: `categoria_padre_id` (auto-referencia) + CTE recursiva en repository para obtener el árbol.
**Por qué**: Es el enfoque más normalizado (3FN), no requiere lógica de mantenimiento de paths, y PostgreSQL optimiza CTEs recursivas con `WITH RECURSIVE`. Materialized path (ej: `path = "1/3/5"`) requiere lógica adicional para mantenerlo sincronizado.
**Alternativa**: `ltree` de PostgreSQL — potente pero introduce dependencia de extensión de DB.

### 2. Soft delete en Categoria con validación de integridad
**Decisión**: `deleted_at TIMESTAMPTZ`. Al eliminar una categoría, se marca como eliminada pero NO se eliminan sus hijos (soft delete en cascada lógica: los hijos existen pero una categoría eliminada no puede ser padre de nuevas).
**Por qué**: Si se elimina una categoría padre, los productos podrían quedar huérfanos. Soft delete permite restaurar.
**Validación**: `categoria_padre_id` no puede referenciar una categoría eliminada (check `deleted_at IS NULL`).

### 3. Módulos separados vs module único de catálogo
**Decisión**: Dos módulos separados: `categorias` e `ingredientes`.
**Por qué**: Cada uno tiene su propio ciclo de vida, validaciones y repositorio. En change 08 se agrega `productos` como tercer módulo. Separarlos desde el inicio evita módulos gigantes.
**Alternativa**: Un solo `catalogo/` module — descartado porque violaría SRP al mezclar dos entidades con lógica de negocio diferente.

### 4. RBAC: ADMIN y STOCK tienen permisos similares
**Decisión**: ADMIN puede crear/editar/eliminar categorías e ingredientes. STOCK puede leer y actualizar stock (en change 08). Para este change, STOCK solo lectura (igual que CLIENT) hasta que llegue change 08.
**Por qué**: En el ERD, STOCK gestiona stock de productos, no categorías/ingredientes. Pero ver el listado sí necesita.

### 5. Validación anti-ciclos
**Decisión**: Al actualizar `categoria_padre_id`, el service ejecuta una consulta CTE recursiva que verifica que el nuevo padre no sea descendiente del nodo actual. Si hay ciclo, se rechaza con 422.
**Por qué**: Sin esta validación, un UPDATE podría crear un ciclo infinito en la jerarquía (A → B → A).

## Risks / Trade-offs

- **[CTE recursiva en cada request de árbol]** → Para la mayoría de catálogos con < 100 categorías es insignificante. Si escala, se puede cachear el árbol con Redis.
- **[Soft delete en jerarquía]** → Una categoría padre eliminada con hijos activos no debería poder restaurarse sin revisar a los hijos. Se mitiga con documentación en el endpoint de restore.
- **[Seed de ingredientes muy específico]** → Los ingredientes del seed son ejemplos. El ADMIN puede modificarlos después. No bloquea.

## Open Questions

- Ninguna por ahora. El diseño está alineado con `docs/Integrador.txt` y el ERD v5.
