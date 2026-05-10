## 1. Modelos SQLModel

- [ ] 1.1 Crear `app/modules/categorias/model.py` con `Categoria(SQLModel, table=True)`: id, nombre (unique, index), categoria_padre_id (FK self-ref, nullable), deleted_at, created_at, updated_at
- [ ] 1.2 Crear `app/modules/ingredientes/model.py` con `Ingrediente(SQLModel, table=True)`: id, nombre (unique, index), es_alergeno (default false), deleted_at, created_at, updated_at
- [ ] 1.3 Agregar `children: List[Categoria] = Relationship(...)` en Categoria con `sa_relationship_kwargs` para la jerarquía
- [ ] 1.4 Importar ambos modelos en `app/db/models/__init__.py` para que SQLModel los detecte

## 2. Migración Alembic

- [ ] 2.1 Generar migration `alembic revision --autogenerate -m "add_categoria_ingrediente"` y verificar que crea ambas tablas
- [ ] 2.2 Verificar constraints: FK categoria_padre_id → categoria.id, unique en nombre de ambas tablas, deleted_at nullable
- [ ] 2.3 Aplicar migration: `alembic upgrade head`

## 3. Schemas Pydantic

- [ ] 3.1 Crear `app/modules/categorias/schemas.py`: CategoriaCreate (nombre, categoria_padre_id optional), CategoriaUpdate (todos optional), CategoriaRead (id, nombre, categoria_padre_id, children list, created_at)
- [ ] 3.2 Crear `app/modules/ingredientes/schemas.py`: IngredienteCreate (nombre, es_alergeno optional), IngredienteUpdate (todos optional), IngredienteRead (id, nombre, es_alergeno, created_at)
- [ ] 3.3 Validar en CategoriaCreate: nombre 1-100 chars, categoria_padre_id debe referenciar categoría activa
- [ ] 3.4 Validar en IngredienteCreate: nombre 1-100 chars, unique name check

## 4. Repositories

- [ ] 4.1 Crear `app/modules/categorias/repository.py` con `CategoriaRepository(BaseRepository[Categoria])`: get_tree() con CTE recursiva, get_children(parent_id), validate_parent_exists(parent_id), check_circular_ref(id, new_parent_id)
- [ ] 4.2 Crear `app/modules/ingredientes/repository.py` con `IngredienteRepository(BaseRepository[Ingrediente])`: get_by_nombre(name), list_alergenos()
- [ ] 4.3 Registrar ambos repositorios en `app/core/uow.py` (UnitOfWork)

## 5. Services

- [ ] 5.1 Crear `app/modules/categorias/service.py` con `CategoriaService`: create (validar parent activo), update (validar anti-ciclos), soft_delete, get_tree, get_by_id, list_all
- [ ] 5.2 Crear `app/modules/ingredientes/service.py` con `IngredienteService`: create (validar unique nombre), update, soft_delete, get_by_id, list_all, list_alergenos
- [ ] 5.3 Validación anti-ciclos en CategoriaService.update: no permitir que categoria_padre_id sea descendiente del nodo actual

## 6. Routers

- [ ] 6.1 Crear `app/modules/categorias/router.py`: POST/GET /categorias, GET /categorias/{id}, PUT /categorias/{id}, DELETE /categorias/{id}, GET /categorias/arbol (público)
- [ ] 6.2 Crear `app/modules/ingredientes/router.py`: POST/GET /ingredientes, GET /ingredientes/{id}, PUT /ingredientes/{id}, DELETE /ingredientes/{id}, GET /ingredientes?alergeno=true
- [ ] 6.3 Proteger endpoints: ADMIN/STOCK para write operations, autenticados para list/get, público para /arbol y /ingredientes si es listado público
- [ ] 6.4 Registrar ambos routers en `app/core/main.py` con prefijo `/api/v1`

## 7. Seed Data

- [ ] 7.1 Agregar seed de categorías base en `app/db/seed.py`: Bebidas → [Gaseosas, Aguas, Jugos], Comidas → [Hamburguesas, Pizzas, Empanadas], Snacks, Postres, Salsas y Aderezos
- [ ] 7.2 Agregar seed de ingredientes en `app/db/seed.py`: Queso, Lechuga, Tomate, Cebolla, Huevo (no alérgenos) + Gluten, Leche, Maní, Soja, Mostaza (alérgenos)
- [ ] 7.3 Asegurar idempotencia: upsert por nombre, no duplicar al ejecutar seed múltiples veces

## 8. Verificación

- [ ] 8.1 Verificar en Swagger que todos los endpoints aparecen con schemas correctos
- [ ] 8.2 Probar CRUD de categorías: crear raíz → crear subcategoría → crear sub-sub → listar árbol
- [ ] 8.3 Probar validación anti-ciclos: intentar asignar hijo como padre de su propio ancestro
- [ ] 8.4 Probar CRUD de ingredientes: crear, actualizar flag alérgeno, soft delete
- [ ] 8.5 Probar RBAC: CLIENT no puede crear/editar/eliminar, ADMIN sí
- [ ] 8.6 Probar seed idempotente: ejecutar seed dos veces sin duplicados
