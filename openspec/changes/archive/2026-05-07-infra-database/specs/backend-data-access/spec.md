## ADDED Requirements

### Requirement: BaseRepository[T] genérico en core

El backend SHALL definir una clase genérica `BaseRepository[T]` en `backend/app/core/repository.py` que encapsule las operaciones CRUD comunes para cualquier modelo SQLModel. La clase SHALL recibir la sesión de base de datos por inyección en el constructor (no la abrir internamente). Los módulos de negocio heredan de `BaseRepository` y agregan queries específicas.

**Métodos mínimos que SHALL implementar**:
- `get_by_id(entity_id: int) → T | None`
- `list_all(skip: int = 0, limit: int = 100) → list[T]`
- `count() → int`
- `create(entity: T) → T`
- `update(entity: T) → T`
- `soft_delete(entity: T) → None` (setea `deleted_at = now()`)
- `hard_delete(entity: T) → None`

#### Scenario: Módulo hereda BaseRepository y obtiene CRUD sin reimplementar

- **GIVEN** una clase `ProductoRepository(BaseRepository[Producto])`
- **WHEN** se llama `repo.get_by_id(1)`
- **THEN** retorna el `Producto` con `id=1` o `None` si no existe, sin que `ProductoRepository` tenga que reimplementar el método

#### Scenario: soft_delete setea deleted_at

- **GIVEN** un `Usuario` activo (sin `deleted_at`)
- **WHEN** se llama `repo.soft_delete(usuario)`
- **THEN** la columna `deleted_at` queda seteada con el timestamp actual y el registro permanece en la tabla

#### Scenario: Inyección de sesión en constructor

- **WHEN** se instancia `ProductoRepository(session=session)`
- **THEN** el repo usa esa sesión para todas las operaciones, sin abrir una nueva

### Requirement: UnitOfWork como context manager async

El backend SHALL definir `UnitOfWork` en `backend/app/core/uow.py` como un async context manager que:
1. Abre una sesión de base de datos al entrar
2. Provee acceso a repositorios como atributos (ej. `uow.usuarios`, `uow.productos`)
3. Ejecuta `session.commit()` al salir sin excepción
4. Ejecuta `session.rollback()` si ocurre una excepción, luego la re-lanza

Ningún service SHALL llamar a `session.commit()` directamente — esa responsabilidad pertenece al `UnitOfWork`.

#### Scenario: Commit automático al cerrar el contexto sin errores

- **GIVEN** un service que inserta un Usuario dentro de `async with UnitOfWork() as uow:`
- **WHEN** el bloque termina sin excepciones
- **THEN** el UoW ejecuta `commit()` y el registro queda persistido en la base de datos

#### Scenario: Rollback automático ante excepción

- **GIVEN** un service que inserta un Usuario y luego lanza una excepción dentro del `async with UnitOfWork() as uow:`
- **WHEN** la excepción ocurre
- **THEN** el UoW ejecuta `rollback()` y el Usuario NO queda persistido en la base de datos

#### Scenario: Acceso a repositorios desde el UoW

- **WHEN** se accede a `uow.usuarios` dentro del contexto
- **THEN** retorna una instancia de `UsuarioRepository` inicializada con la sesión activa del UoW

### Requirement: Dependencia de sesión async para routers FastAPI

El backend SHALL exponer una función generadora `get_session()` en `backend/app/db/session.py` (o `backend/app/core/session.py`) utilizable como dependencia FastAPI (`Depends(get_session)`). La función SHALL abrir una `AsyncSession`, cederla al handler via `yield`, y cerrarla (no commitear) al finalizar — el commit es responsabilidad del UoW, no de la dependencia.

#### Scenario: Sesión disponible en un router FastAPI

- **GIVEN** un endpoint con `session: AsyncSession = Depends(get_session)`
- **WHEN** se recibe una request
- **THEN** `session` es una `AsyncSession` válida y lista para usar

#### Scenario: Sesión cerrada después de la respuesta

- **WHEN** el handler finaliza (con éxito o con excepción)
- **THEN** la sesión es cerrada automáticamente por el generador, devolviendo la conexión al pool
