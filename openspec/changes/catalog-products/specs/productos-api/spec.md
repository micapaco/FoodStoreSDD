## ADDED Requirements

### Requirement: CRUD de productos (ADMIN)
El sistema SHALL exponer endpoints REST protegidos para la gestión completa de productos.

#### Scenario: Crear producto
- **WHEN** un usuario con rol ADMIN envía `POST /api/v1/productos` con `{nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_ids[], ingrediente_ids[]}`
- **THEN** el sistema responde `201 Created` con el producto creado, y las relaciones en `ProductoCategoria` y `ProductoIngrediente` quedan persistidas

#### Scenario: Listar productos (protegido)
- **WHEN** un usuario ADMIN envía `GET /api/v1/productos?page=1&size=20`
- **THEN** el sistema responde `200 OK` con `{items: Producto[], total: N, page: 1, size: 20, pages: P}` excluyendo soft-deleted

#### Scenario: Obtener producto por ID
- **WHEN** un usuario ADMIN envía `GET /api/v1/productos/{id}`
- **THEN** el sistema responde `200 OK` con el producto expandido incluyendo `categorias[]` e `ingredientes[]`
- **THEN** si el producto no existe o está soft-deleted, responde `404 Not Found`

#### Scenario: Actualizar producto
- **WHEN** un usuario ADMIN envía `PUT /api/v1/productos/{id}` con datos parciales
- **THEN** el sistema responde `200 OK` con el producto actualizado y sincroniza las relaciones

#### Scenario: Soft delete producto
- **WHEN** un usuario ADMIN envía `DELETE /api/v1/productos/{id}`
- **THEN** el sistema responde `204 No Content` y marca `deleted_at` con el timestamp actual

### Requirement: Control de stock (ADMIN/STOCK)
El sistema SHALL exponer endpoints para la gestión de stock y disponibilidad.

#### Scenario: Actualizar stock
- **WHEN** un usuario con rol ADMIN o STOCK envía `PATCH /api/v1/productos/{id}/stock` con `{stock_cantidad}`
- **THEN** el sistema responde `200 OK` y actualiza `stock_cantidad` validando >= 0

#### Scenario: Toggle disponibilidad
- **WHEN** un usuario con rol ADMIN o STOCK envía `PATCH /api/v1/productos/{id}/disponibilidad` con `{disponible: bool}`
- **THEN** el sistema responde `200 OK` y actualiza el campo `disponible`

#### Scenario: Stock insuficiente
- **WHEN** un usuario intenta setear `stock_cantidad` a un valor negativo
- **THEN** el sistema responde `422 Unprocessable Entity` con violación de constraint

### Requirement: Relaciones con categorías
El sistema SHALL permitir asignar y desasignar categorías a un producto.

#### Scenario: Asignar categorías
- **WHEN** se crea o actualiza un producto con `categoria_ids: [1, 2]`
- **THEN** el sistema sincroniza `ProductoCategoria` eliminando las relaciones no incluidas y creando las nuevas

#### Scenario: Categoría no existente
- **WHEN** se asigna un `categoria_id` que no existe o está soft-deleted
- **THEN** el sistema responde `422 Unprocessable Entity` indicando la categoría inválida

### Requirement: Relaciones con ingredientes
El sistema SHALL permitir asignar y desasignar ingredientes a un producto.

#### Scenario: Asignar ingredientes
- **WHEN** se crea o actualiza un producto con `ingrediente_ids: [{id: 1, es_removible: true}, {id: 2, es_removible: false}]`
- **THEN** el sistema sincroniza `ProductoIngrediente` actualizando `es_removible` por cada relación

#### Scenario: Ingrediente no existente
- **WHEN** se asigna un `ingrediente_id` que no existe o está soft-deleted
- **THEN** el sistema responde `422 Unprocessable Entity` indicando el ingrediente inválido

### Requirement: Catálogo público de productos
El sistema SHALL exponer endpoints públicos de consulta de productos.

#### Scenario: Listar productos públicos
- **WHEN** cualquier usuario (incluso anónimo) envía `GET /api/v1/productos?page=1&size=20`
- **THEN** el sistema responde `200 OK` con solo productos con `disponible=true` y `deleted_at IS NULL`, paginados

#### Scenario: Filtrar por categoría
- **WHEN** un usuario envía `GET /api/v1/productos?categoria_id=5`
- **THEN** el sistema responde solo productos asociados a esa categoría

#### Scenario: Buscar por texto
- **WHEN** un usuario envía `GET /api/v1/productos?q=pizza`
- **THEN** el sistema responde productos cuyo `nombre` o `descripcion` contienen "pizza" (ILIKE)

#### Scenario: Filtrar por rango de precio
- **WHEN** un usuario envía `GET /api/v1/productos?precio_min=10&precio_max=50`
- **THEN** el sistema responde productos con `precio_base` entre 10 y 50

#### Scenario: Filtrar por ingrediente
- **WHEN** un usuario envía `GET /api/v1/productos?ingrediente_id=3`
- **THEN** el sistema responde productos que contienen ese ingrediente

#### Scenario: Combinar filtros
- **WHEN** un usuario envía `GET /api/v1/productos?categoria_id=5&precio_min=10&q=carne`
- **THEN** el sistema responde productos que cumplen TODOS los filtros simultáneamente

#### Scenario: Detalle público de producto
- **WHEN** cualquier usuario envía `GET /api/v1/productos/{id}`
- **THEN** el sistema responde `200 OK` con el producto expandido incluyendo `categorias` y `ingredientes`
- **THEN** si el producto no está disponible o está soft-deleted, responde `404 Not Found`

### Requirement: Ordenamiento
El sistema SHALL soportar ordenamiento configurable en la lista de productos.

#### Scenario: Ordenar por precio
- **WHEN** un usuario envía `GET /api/v1/productos?sort=precio_base&order=asc`
- **THEN** el sistema responde productos ordenados por precio ascendente

#### Scenario: Ordenar por nombre
- **WHEN** un usuario envía `GET /api/v1/productos?sort=nombre&order=desc`
- **THEN** el sistema responde productos ordenados por nombre descendente

#### Scenario: Ordenar por fecha de creación
- **WHEN** un usuario envía `GET /api/v1/productos?sort=created_at&order=desc`
- **THEN** el sistema responde productos ordenados por fecha de creación descendente
