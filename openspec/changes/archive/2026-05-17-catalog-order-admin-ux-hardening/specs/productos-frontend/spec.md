## MODIFIED Requirements

### Requirement: Crear producto
El sistema SHALL proveer un formulario para crear productos con soporte de imagen por URL o upload.

#### Scenario: Formulario de creacion
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra un formulario con campos: nombre, descripcion, precio_base, stock_cantidad, disponible, imagen, selector de categorias, selector de ingredientes con toggle es_removible

#### Scenario: Campo de imagen por URL
- **WHEN** un usuario ADMIN elige usar URL externa
- **THEN** el sistema muestra el campo de texto `imagen_url` con label "Imagen (URL)"

#### Scenario: Upload de imagen local
- **WHEN** un usuario ADMIN elige subir una imagen local valida
- **THEN** el sistema llama `POST /api/v1/productos/imagenes`
- **AND** usa la `imagen_url` retornada para crear el producto

#### Scenario: Ayuda de ingredientes removibles
- **WHEN** un usuario ADMIN configura ingredientes de un producto
- **THEN** el formulario explica que solo los ingredientes marcados como removibles apareceran como exclusiones para el cliente

#### Scenario: Preview de imagen en tiempo real
- **WHEN** el usuario escribe una URL valida o sube una imagen valida
- **THEN** el sistema muestra una preview de la imagen debajo del campo en tiempo real

#### Scenario: Preview con URL invalida
- **WHEN** el usuario escribe una URL que no carga una imagen
- **THEN** el sistema muestra un placeholder en el area de preview sin errores de UI

#### Scenario: Validacion de longitud
- **WHEN** el usuario ingresa una URL de mas de 500 caracteres
- **THEN** el sistema muestra un error de validacion "La URL no puede superar los 500 caracteres" sin enviar el request

#### Scenario: Creacion exitosa con imagen
- **WHEN** el usuario completa el formulario con `imagen_url` valida y confirma
- **THEN** el sistema envia `POST /api/v1/productos` con el campo `imagen_url` incluido y redirige al listado con toast de exito

### Requirement: Editar producto
El sistema SHALL proveer un formulario para editar productos existentes con soporte de imagen por URL o upload.

#### Scenario: Formulario de edicion
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema carga los datos del producto y los muestra en el mismo formulario de creacion precargados, incluyendo el campo `imagen_url`

#### Scenario: Reemplazar imagen por upload
- **WHEN** un usuario ADMIN sube una nueva imagen local en edicion
- **THEN** el sistema obtiene una nueva `imagen_url` via upload
- **AND** envia esa URL en `PUT /api/v1/productos/{id}`

#### Scenario: Limpiar imagen en edicion
- **WHEN** el usuario borra el contenido del campo `imagen_url` y guarda
- **THEN** el sistema envia `imagen_url: null` y el producto queda sin imagen
