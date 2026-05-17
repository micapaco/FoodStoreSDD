## MODIFIED Requirements

### Requirement: Crear producto
El sistema SHALL proveer un formulario para crear productos con soporte de imagen.

#### Scenario: Campo imagen_url en formulario
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra el formulario incluyendo un campo de texto `imagen_url` (URL de imagen, opcional) con label "Imagen (URL)"

#### Scenario: Preview de imagen en tiempo real
- **WHEN** el usuario escribe una URL válida en el campo `imagen_url`
- **THEN** el sistema muestra una preview de la imagen debajo del campo en tiempo real

#### Scenario: Preview con URL inválida
- **WHEN** el usuario escribe una URL que no carga una imagen
- **THEN** el sistema muestra un placeholder en el área de preview sin errores de UI

#### Scenario: Validación de longitud
- **WHEN** el usuario ingresa una URL de más de 500 caracteres
- **THEN** el sistema muestra un error de validación "La URL no puede superar los 500 caracteres" sin enviar el request

#### Scenario: Creación exitosa con imagen
- **WHEN** el usuario completa el formulario con `imagen_url` válida y confirma
- **THEN** el sistema envía `POST /api/v1/productos` con el campo `imagen_url` incluido y redirige al listado con toast de éxito

### Requirement: Editar producto
El sistema SHALL incluir el campo imagen en el formulario de edición.

#### Scenario: Formulario de edición con imagen precargada
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema precarga el valor de `imagen_url` en el campo correspondiente y muestra la preview actual

#### Scenario: Limpiar imagen en edición
- **WHEN** el usuario borra el contenido del campo `imagen_url` y guarda
- **THEN** el sistema envía `imagen_url: null` y el producto queda sin imagen

### Requirement: Catálogo de productos (cliente)
El sistema SHALL mostrar imágenes reales en el grid de productos del catálogo.

#### Scenario: Producto con imagen en catálogo
- **WHEN** un cliente navega al catálogo y un producto tiene `imagen_url` definida
- **THEN** el sistema muestra la imagen del producto en la card en lugar del placeholder SVG

#### Scenario: Producto sin imagen en catálogo
- **WHEN** un cliente navega al catálogo y un producto tiene `imagen_url: null`
- **THEN** el sistema muestra el placeholder SVG existente (sin error visual)

#### Scenario: Imagen rota en catálogo
- **WHEN** la URL de imagen no carga (error de red o URL inválida)
- **THEN** el sistema muestra silenciosamente el placeholder SVG sin romper la UI

### Requirement: Detalle de producto (cliente)
El sistema SHALL mostrar la imagen en la vista de detalle pública.

#### Scenario: Detalle con imagen
- **WHEN** un cliente navega a `/productos/{id}` y el producto tiene `imagen_url`
- **THEN** el sistema muestra la imagen en el panel izquierdo con `aspect-[4/3]` y `object-cover`

#### Scenario: Detalle sin imagen
- **WHEN** un cliente navega a `/productos/{id}` y el producto no tiene imagen
- **THEN** el sistema muestra el panel existente con el placeholder SVG

### Requirement: Detalle de producto (admin)
El sistema SHALL mostrar la imagen en la vista de detalle del panel admin.

#### Scenario: Detalle admin con imagen
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/productos/{id}`
- **THEN** el sistema muestra la imagen del producto en una sección visual del detalle

#### Scenario: Detalle admin sin imagen
- **WHEN** el producto no tiene imagen configurada
- **THEN** el sistema indica "Sin imagen configurada" en lugar del área de imagen
