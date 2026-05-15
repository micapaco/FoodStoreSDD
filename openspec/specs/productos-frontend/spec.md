## ADDED Requirements

### Requirement: Listado de productos (admin)
El sistema SHALL mostrar una tabla paginada de productos con filtros para los roles ADMIN y STOCK.

#### Scenario: Tabla de productos
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/productos`
- **THEN** el sistema muestra una tabla con columnas: nombre, precio, stock, disponible, categorías, acciones
- **THEN** la tabla soporta paginación con selector de tamaño (10/20/50)

#### Scenario: Filtros en listado
- **WHEN** un usuario ADMIN o STOCK está en la página de productos
- **THEN** el sistema muestra filtros por: texto (búsqueda), categoría (select), disponible (toggle), stock bajo (checkbox)
- **THEN** al cambiar un filtro, la tabla se actualiza automáticamente

#### Scenario: Búsqueda por texto
- **WHEN** un usuario ADMIN escribe en el campo de búsqueda
- **THEN** el sistema filtra productos cuyo nombre o descripción coinciden con el texto

### Requirement: Crear producto
El sistema SHALL proveer un formulario para crear productos con soporte de imagen.

#### Scenario: Formulario de creación
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra un formulario con campos: nombre, descripción, precio_base, stock_cantidad, disponible (toggle), imagen_url (URL de imagen, opcional), selector de categorías, selector de ingredientes con toggle es_removible

#### Scenario: Campo imagen_url en formulario
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra el campo de texto `imagen_url` con label "Imagen (URL)"

#### Scenario: Preview de imagen en tiempo real
- **WHEN** el usuario escribe una URL válida en el campo `imagen_url`
- **THEN** el sistema muestra una preview de la imagen debajo del campo en tiempo real

#### Scenario: Preview con URL inválida
- **WHEN** el usuario escribe una URL que no carga una imagen
- **THEN** el sistema muestra un placeholder en el área de preview sin errores de UI

#### Scenario: Validación de longitud
- **WHEN** el usuario ingresa una URL de más de 500 caracteres
- **THEN** el sistema muestra un error de validación "La URL no puede superar los 500 caracteres" sin enviar el request

#### Scenario: Validación de campos
- **WHEN** el usuario envía el formulario con datos inválidos (precio negativo, nombre vacío)
- **THEN** el sistema muestra errores de validación sin enviar el request

#### Scenario: Creación exitosa con imagen
- **WHEN** el usuario completa el formulario con `imagen_url` válida y confirma
- **THEN** el sistema envía `POST /api/v1/productos` con el campo `imagen_url` incluido y redirige al listado con toast de éxito

### Requirement: Editar producto
El sistema SHALL proveer un formulario para editar productos existentes con soporte de imagen.

#### Scenario: Formulario de edición
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema carga los datos del producto y los muestra en el mismo formulario de creación precargados, incluyendo el campo `imagen_url`

#### Scenario: Formulario de edición con imagen precargada
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema precarga el valor de `imagen_url` en el campo correspondiente y muestra la preview actual

#### Scenario: Limpiar imagen en edición
- **WHEN** el usuario borra el contenido del campo `imagen_url` y guarda
- **THEN** el sistema envía `imagen_url: null` y el producto queda sin imagen

#### Scenario: Edición exitosa
- **WHEN** el usuario modifica datos y confirma
- **THEN** el sistema envía `PUT /api/v1/productos/{id}` y redirige al listado con un toast de éxito

### Requirement: Detalle de producto (admin)
El sistema SHALL mostrar el detalle completo de un producto, incluyendo imagen.

#### Scenario: Página de detalle
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/productos/{id}`
- **THEN** el sistema muestra: nombre, descripción, precio, stock, disponible, categorías (con badges), ingredientes (con badge de alérgeno y es_removible)

#### Scenario: Detalle admin con imagen
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/productos/{id}` y el producto tiene `imagen_url`
- **THEN** el sistema muestra la imagen del producto en una sección visual con `max-h-48 object-contain`

#### Scenario: Detalle admin sin imagen
- **WHEN** el producto no tiene imagen configurada
- **THEN** el sistema indica "Sin imagen configurada" en lugar del área de imagen

### Requirement: Gestión de stock (STOCK)
El sistema SHALL permitir a usuarios STOCK gestionar stock sin acceder a datos financieros.

#### Scenario: Editar stock desde listado
- **WHEN** un usuario STOCK está en la tabla de productos
- **THEN** el sistema muestra controles inline para editar `stock_cantidad` y toggle `disponible`
- **THEN** el usuario NO puede ver ni editar `precio_base` ni otros campos financieros

### Requirement: Soft delete de producto
El sistema SHALL permitir eliminar productos con confirmación.

#### Scenario: Confirmación de eliminación
- **WHEN** un usuario ADMIN hace clic en eliminar
- **THEN** el sistema muestra un modal de confirmación antes de proceder

#### Scenario: Eliminación exitosa
- **WHEN** el usuario confirma la eliminación
- **THEN** el sistema envía `DELETE /api/v1/productos/{id}` y muestra un toast con confirmación

### Requirement: Catálogo público
El sistema SHALL mostrar un catálogo público de productos para clientes con imágenes reales.

#### Scenario: Grid de productos
- **WHEN** un cliente navega a `/productos`
- **THEN** el sistema muestra productos en un grid tipo tarjeta con: imagen real (si disponible) o placeholder SVG, nombre, precio, badges de categorías, indicador de alérgenos
- **THEN** solo se muestran productos con `disponible=true`

#### Scenario: Producto con imagen en catálogo
- **WHEN** un cliente navega al catálogo y un producto tiene `imagen_url` definida
- **THEN** el sistema muestra la imagen del producto en la card en lugar del placeholder SVG

#### Scenario: Producto sin imagen en catálogo
- **WHEN** un cliente navega al catálogo y un producto tiene `imagen_url: null`
- **THEN** el sistema muestra el placeholder SVG existente (sin error visual)

#### Scenario: Imagen rota en catálogo
- **WHEN** la URL de imagen no carga (error de red o URL inválida)
- **THEN** el sistema muestra silenciosamente el placeholder SVG sin romper la UI

#### Scenario: Filtros en catálogo público
- **WHEN** un cliente está en el catálogo público
- **THEN** el sistema muestra filtros: búsqueda por texto, categoría (select), rango de precio (slider o inputs)

#### Scenario: Detalle público con imagen
- **WHEN** un cliente navega a `/productos/{id}` y el producto tiene `imagen_url`
- **THEN** el sistema muestra la imagen en el panel izquierdo con `aspect-[4/3]` y `object-cover`

#### Scenario: Detalle público sin imagen
- **WHEN** un cliente navega a `/productos/{id}` y el producto no tiene imagen
- **THEN** el sistema muestra el panel existente con el placeholder SVG

#### Scenario: Detalle público
- **WHEN** un cliente hace clic en un producto del catálogo
- **THEN** el sistema navega a `/productos/{id}` mostrando: nombre, descripción, precio, categorías, ingredientes con indicación de alérgenos, y botón "Agregar al carrito"

### Requirement: Estados vacío y error
El sistema SHALL manejar estados de carga, vacío y error en todas las vistas de productos.

#### Scenario: Estado vacío
- **WHEN** no hay productos que coincidan con los filtros
- **THEN** el sistema muestra un mensaje "No se encontraron productos" con icono

#### Scenario: Error de carga
- **WHEN** falla la carga de productos
- **THEN** el sistema muestra un mensaje de error con botón "Reintentar"
