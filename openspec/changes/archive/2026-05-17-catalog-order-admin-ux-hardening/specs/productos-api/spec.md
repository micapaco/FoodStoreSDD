## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Upload de imagen de producto
El sistema SHALL exponer un endpoint protegido para que usuarios ADMIN carguen imagenes locales de producto y obtengan una URL interna compatible con `imagen_url`.

#### Scenario: Upload exitoso
- **WHEN** un ADMIN envia `POST /api/v1/productos/imagenes` con multipart file de imagen valida
- **THEN** el sistema guarda el archivo con nombre seguro
- **AND** responde `201 Created` con `{ imagen_url: "<url interna>" }`

#### Scenario: Tipo de archivo invalido
- **WHEN** un ADMIN sube un archivo que no es `jpg`, `jpeg`, `png` o `webp`
- **THEN** el sistema responde `422 Unprocessable Entity`

#### Scenario: Archivo demasiado grande
- **WHEN** un ADMIN sube una imagen que supera el tamano maximo definido
- **THEN** el sistema responde `413 Payload Too Large` o `422 Unprocessable Entity` con mensaje claro

#### Scenario: Usuario sin rol ADMIN
- **WHEN** un usuario sin rol ADMIN intenta subir una imagen de producto
- **THEN** el sistema responde `403 Forbidden`
