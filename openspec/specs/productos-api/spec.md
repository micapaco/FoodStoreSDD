## Purpose
Define los contratos backend para administracion, stock, relaciones y catalogo publico de productos.
## Requirements
### Requirement: CRUD de productos (ADMIN)
El sistema SHALL exponer endpoints REST protegidos para la gestion completa de productos.
El campo persistido de imagen de producto SHALL seguir siendo `imagen_url`, tanto para URLs externas como para URLs internas generadas por upload.

#### Scenario: Crear producto con imagen
- **WHEN** un usuario con rol ADMIN envia `POST /api/v1/productos` con `{nombre, descripcion, precio_base, stock_cantidad, disponible, categoria_ids[], ingrediente_ids[], imagen_url?}`
- **THEN** el sistema responde `201 Created` con el producto creado incluyendo el campo `imagen_url` (null si no se proveyo), y las relaciones en `ProductoCategoria` y `ProductoIngrediente` quedan persistidas

#### Scenario: Crear producto sin imagen
- **WHEN** un usuario con rol ADMIN envia `POST /api/v1/productos` omitiendo el campo `imagen_url`
- **THEN** el sistema responde `201 Created` con `imagen_url: null` en la respuesta

#### Scenario: Actualizar producto - imagen_url interna
- **WHEN** un usuario con rol ADMIN envia `PUT /api/v1/productos/{id}` con una `imagen_url` devuelta por el endpoint de upload
- **THEN** el sistema responde `200 OK` con el producto actualizado y `imagen_url` persistida

#### Scenario: Limpiar imagen de producto
- **WHEN** un usuario con rol ADMIN envia `PUT /api/v1/productos/{id}` con `{imagen_url: null}`
- **THEN** el sistema responde `200 OK` con `imagen_url: null` en la respuesta

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
- **THEN** el sistema responde `200 OK` con el producto expandido incluyendo `categorias`, `ingredientes` e `imagen_url`
- **THEN** si el producto no está disponible o está soft-deleted, responde `404 Not Found`

#### Scenario: Listar catálogo con imagen
- **WHEN** cualquier cliente (autenticado o no) consulta `GET /api/v1/productos`
- **THEN** el sistema incluye `imagen_url` en cada item de la respuesta paginada

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

### Requirement: Upload de imagen de producto
El sistema SHALL exponer un endpoint protegido para que usuarios ADMIN carguen imagenes locales de producto y obtengan una URL interna compatible con `imagen_url`.

#### Scenario: Upload exitoso
- **WHEN** un ADMIN envia `POST /api/v1/productos/imagenes` con multipart file de imagen valida
- **THEN** el sistema guarda el archivo con nombre seguro
- **AND** responde `201 Created` con `{ imagen_url: "<url interna>" }`

#### Scenario: Tipo de archivo invalido
- **WHEN** un ADMIN sube un archivo que no es `jpg`, `jpeg`, `png`, `webp`, `gif` o `avif`
- **THEN** el sistema responde `422 Unprocessable Entity`

#### Scenario: Archivo demasiado grande
- **WHEN** un ADMIN sube una imagen que supera el tamano maximo definido
- **THEN** el sistema responde `413 Payload Too Large` o `422 Unprocessable Entity` con mensaje claro

#### Scenario: Usuario sin rol ADMIN
- **WHEN** un usuario sin rol ADMIN intenta subir una imagen de producto
- **THEN** el sistema responde `403 Forbidden`

#### Scenario: Ruta de upload no colisiona con detalle de producto
- **WHEN** un cliente HTTP envia `POST /api/v1/productos/imagenes` sin credenciales validas
- **THEN** el sistema procesa la ruta estatica de upload y responde un error de autenticacion o autorizacion
- **AND** la respuesta no es un error de validacion de path para `producto_id`

### Requirement: Imagenes locales en seed de productos
El sistema SHALL asociar imagenes locales a los productos base de seed cuando los assets existan.

#### Scenario: Seed asigna imagen local existente
- **WHEN** se ejecuta la seed y existe `backend/app/modules/productos/imagenes/pizza.jpg`
- **THEN** el producto `Pizza Mozzarella` se crea o actualiza con una `imagen_url` local servida por el backend
- **AND** la URL apunta a un archivo publicado bajo `/static/uploads/productos/`

#### Scenario: Seed asigna imagenes a productos base
- **WHEN** se ejecuta la seed con assets disponibles para `pizza`, `hamburguesa`, `cocacola`, `agua`, `papas` y `flan`
- **THEN** los productos `Pizza Mozzarella`, `Hamburguesa Clasica`, `Coca-Cola 500ml`, `Agua Mineral 500ml`, `Papas Fritas` y `Flan con Crema` quedan asociados a sus imagenes correspondientes

#### Scenario: Asset seed faltante no rompe el producto
- **WHEN** se ejecuta la seed y no existe el asset local de un producto base
- **THEN** la seed completa correctamente
- **AND** el producto se crea o mantiene sin `imagen_url` para que el frontend muestre placeholder

#### Scenario: Seed no pisa imagen manual del admin
- **WHEN** un producto seed ya existe con una `imagen_url` cargada manualmente por un ADMIN
- **THEN** la seed no reemplaza esa imagen por el asset local
