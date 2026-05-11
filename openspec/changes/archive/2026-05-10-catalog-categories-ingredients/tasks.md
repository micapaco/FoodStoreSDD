## 1. Modelos SQLModel

- [x] 1.1 Crear `app/modules/categorias/model.py` con `Categoria(SQLModel, table=True)`: id, nombre (unique, index), categoria_padre_id (FK self-ref, nullable), deleted_at, created_at, updated_at
- [x] 1.2 Crear `app/modules/ingredientes/model.py` con `Ingrediente(SQLModel, table=True)`: id, nombre (unique, index), es_alergeno (default false), deleted_at, created_at, updated_at
- [x] 1.3 Agregar `children: List[Categoria] = Relationship(...)` en Categoria con `sa_relationship_kwargs` para la jerarquía
- [x] 1.4 Importar ambos modelos en `app/db/models/__init__.py` para que SQLModel los detecte

## 2. Migración Alembic

- [x] 2.1 Crear migration manual `0004_add_categoria_ingrediente_fields.py`: agrega created_at, updated_at, unique constraint en categoria.nombre, index en ingrediente.nombre
- [x] 2.2 Verificar constraints: FK parent_id → categoria.id (ya existe desde 0001), unique en nombre de ambas tablas (agregado), deleted_at nullable
- [x] 2.3 Aplicar migration: `alembic upgrade head` (requiere PostgreSQL corriendo)

## 3. Schemas Pydantic

- [x] 3.1 Crear `app/modules/categorias/schemas.py`: CategoriaCreate (nombre, parent_id optional), CategoriaUpdate (todos optional), CategoriaRead (id, nombre, parent_id, children list, created_at)
- [x] 3.2 Crear `app/modules/ingredientes/schemas.py`: IngredienteCreate (nombre, es_alergeno optional), IngredienteUpdate (todos optional), IngredienteRead (id, nombre, es_alergeno, created_at)
- [x] 3.3 Validar en CategoriaCreate: nombre 1-100 chars, parent_id debe referenciar categoría activa
- [x] 3.4 Validar en IngredienteCreate: nombre 1-100 chars, unique name check

## 4. Repositories

- [x] 4.1 Crear `app/modules/categorias/repository.py` con `CategoriaRepository(BaseRepository[Categoria])`: get_tree() con CTE recursiva, get_children(parent_id), validate_parent_exists(parent_id), check_circular_ref(id, new_parent_id)
- [x] 4.2 Crear `app/modules/ingredientes/repository.py` con `IngredienteRepository(BaseRepository[Ingrediente])`: get_by_nombre(name), list_alergenos()
- [x] 4.3 Registrar ambos repositorios en `app/core/uow.py` (UnitOfWork)

## 5. Services

- [x] 5.1 Crear `app/modules/categorias/service.py` con `CategoriaService`: create (validar parent activo), update (validar anti-ciclos), soft_delete, get_tree, get_by_id, list_all
- [x] 5.2 Crear `app/modules/ingredientes/service.py` con `IngredienteService`: create (validar unique nombre), update, soft_delete, get_by_id, list_all, list_alergenos
- [x] 5.3 Validación anti-ciclos en CategoriaService.update: no permitir que categoria_padre_id sea descendiente del nodo actual

## 6. Routers

- [x] 6.1 Crear `app/modules/categorias/router.py`: POST/GET /categorias, GET /categorias/{id}, PUT /categorias/{id}, DELETE /categorias/{id}, GET /categorias/arbol (público)
- [x] 6.2 Crear `app/modules/ingredientes/router.py`: POST/GET /ingredientes, GET /ingredientes/{id}, PUT /ingredientes/{id}, DELETE /ingredientes/{id}, GET /ingredientes?alergeno=true
- [x] 6.3 Proteger endpoints: ADMIN/STOCK para write operations, autenticados para list/get, público para /arbol y /ingredientes si es listado público
- [x] 6.4 Registrar ambos routers en `app/api/v1/__init__.py` con prefijo `/api/v1`

## 7. Seed Data

- [x] 7.1 Agregar seed de categorías base en `app/db/seed.py`: Bebidas → [Gaseosas, Aguas, Jugos], Comidas → [Hamburguesas, Pizzas, Empanadas], Snacks, Postres, Salsas y Aderezos
- [x] 7.2 Agregar seed de ingredientes en `app/db/seed.py`: Queso, Lechuga, Tomate, Cebolla, Huevo (no alérgenos) + Gluten, Leche, Maní, Soja, Mostaza (alérgenos)
- [x] 7.3 Asegurar idempotencia: upsert por nombre, no duplicar al ejecutar seed múltiples veces

## 8. Verificación

- [x] 8.1 Verificar en Swagger que todos los endpoints aparecen con schemas correctos
- [x] 8.2 Probar CRUD de categorías: crear raíz → crear subcategoría → crear sub-sub → listar árbol
- [x] 8.3 Probar validación anti-ciclos: intentar asignar hijo como padre de su propio ancestro
- [x] 8.4 Probar CRUD de ingredientes: crear, actualizar flag alérgeno, soft delete
- [x] 8.5 Probar RBAC: CLIENT no puede crear/editar/eliminar, ADMIN sí
- [x] 8.6 Probar seed idempotente: ejecutar seed dos veces sin duplicados
