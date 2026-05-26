## MODIFIED Requirements

### Requirement: CRUD de productos (ADMIN)
El sistema SHALL exponer endpoints REST protegidos para la gestión completa de productos.

#### Scenario: Crear producto con imagen
- **WHEN** un usuario con rol ADMIN envía `POST /api/v1/productos` con `{nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_ids[], ingrediente_ids[], imagen_url?}`
- **THEN** el sistema responde `201 Created` con el producto creado incluyendo el campo `imagen_url` (null si no se proveyó)

#### Scenario: Crear producto sin imagen
- **WHEN** un usuario con rol ADMIN envía `POST /api/v1/productos` omitiendo el campo `imagen_url`
- **THEN** el sistema responde `201 Created` con `imagen_url: null` en la respuesta

#### Scenario: Listar productos (protegido)
- **WHEN** un usuario ADMIN envía `GET /api/v1/productos?page=1&size=20`
- **THEN** el sistema responde `200 OK` con `{items: Producto[], total: N, page: 1, size: 20, pages: P}` excluyendo soft-deleted, cada item incluye `imagen_url`

#### Scenario: Obtener producto por ID
- **WHEN** un usuario ADMIN envía `GET /api/v1/productos/{id}`
- **THEN** el sistema responde `200 OK` con el producto expandido incluyendo `categorias[]`, `ingredientes[]` e `imagen_url`
- **THEN** si el producto no existe o está soft-deleted, responde `404 Not Found`

#### Scenario: Actualizar producto — imagen_url
- **WHEN** un usuario con rol ADMIN envía `PUT /api/v1/productos/{id}` con `{imagen_url: "https://..."}`
- **THEN** el sistema responde `200 OK` con el producto actualizado y `imagen_url` persistida

#### Scenario: Limpiar imagen de producto
- **WHEN** un usuario con rol ADMIN envía `PUT /api/v1/productos/{id}` con `{imagen_url: null}`
- **THEN** el sistema responde `200 OK` con `imagen_url: null` en la respuesta

#### Scenario: URL demasiado larga
- **WHEN** un usuario envía `imagen_url` con más de 500 caracteres
- **THEN** el sistema responde `422 Unprocessable Entity` con error de validación en `imagen_url`

#### Scenario: Soft delete producto
- **WHEN** un usuario ADMIN envía `DELETE /api/v1/productos/{id}`
- **THEN** el sistema responde `204 No Content` y marca `deleted_at` con el timestamp actual

### Requirement: Catálogo público
El sistema SHALL exponer el campo `imagen_url` en los endpoints públicos de catálogo.

#### Scenario: Listar catálogo con imagen
- **WHEN** cualquier cliente (autenticado o no) consulta `GET /api/v1/catalogo/productos`
- **THEN** el sistema incluye `imagen_url` en cada item de la respuesta paginada

#### Scenario: Detalle público con imagen
- **WHEN** cualquier cliente consulta `GET /api/v1/catalogo/productos/{id}`
- **THEN** el sistema incluye `imagen_url` en la respuesta de detalle del producto
