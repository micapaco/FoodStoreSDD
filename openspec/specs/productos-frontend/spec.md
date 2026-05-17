## Purpose
Define la experiencia frontend para administrar productos y completar los formularios de catalogo.
## Requirements
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
El sistema SHALL proveer un formulario para crear productos con soporte de imagen por upload local.

#### Scenario: Formulario de creacion
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra un formulario con campos: nombre, descripcion, precio_base, stock_cantidad, disponible, imagen, selector de categorias, selector de ingredientes con toggle es_removible

#### Scenario: Sin campo manual de URL
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema no muestra un campo libre para escribir `imagen_url`
- **AND** la imagen se carga mediante selector de archivo local

#### Scenario: Upload de imagen local en creacion
- **WHEN** un usuario ADMIN selecciona una imagen local valida desde el formulario real de creacion
- **THEN** el sistema llama `POST /api/v1/productos/imagenes`
- **AND** coloca la `imagen_url` retornada en el formulario
- **AND** usa esa `imagen_url` al enviar `POST /api/v1/productos`

#### Scenario: Estado de subida
- **WHEN** la imagen local se esta subiendo
- **THEN** el sistema muestra un estado de carga y evita guardar el producto hasta finalizar el upload

#### Scenario: Error de subida
- **WHEN** el upload de imagen falla
- **THEN** el sistema muestra un error claro y no reemplaza `imagen_url` con un valor invalido

#### Scenario: Formato de imagen soportado
- **WHEN** un usuario ADMIN selecciona una imagen `jpg`, `jpeg`, `png`, `webp`, `gif` o `avif`
- **THEN** el formulario permite intentar el upload

#### Scenario: Preview de imagen en tiempo real
- **WHEN** el usuario sube una imagen valida
- **THEN** el sistema muestra una preview de la imagen debajo del campo en tiempo real

#### Scenario: Preview falla sin romper formulario
- **WHEN** la URL interna de imagen no carga
- **THEN** el sistema muestra un placeholder y permite continuar editando el formulario

### Requirement: Editar producto
El sistema SHALL proveer un formulario para editar productos existentes con soporte de imagen por upload local.

#### Scenario: Formulario de edicion
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema carga los datos del producto y los muestra en el mismo formulario de creacion precargados, incluyendo el campo `imagen_url`

#### Scenario: Reemplazar imagen por upload en edicion
- **WHEN** un usuario ADMIN sube una nueva imagen local en edicion
- **THEN** el sistema obtiene una nueva `imagen_url` via upload
- **AND** envia esa URL en `PUT /api/v1/productos/{id}`

#### Scenario: Limpiar imagen en edicion
- **WHEN** el usuario borra el contenido del campo `imagen_url` y guarda
- **THEN** el sistema envia `imagen_url: null` y el producto queda sin imagen

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

### Requirement: Catalogo con imagenes seed
El sistema SHALL mostrar las imagenes locales de seed cuando los productos las tengan asociadas.

#### Scenario: Producto seed con imagen local
- **WHEN** un cliente navega al catalogo y un producto seed tiene `imagen_url`
- **THEN** el sistema muestra la imagen servida por backend

#### Scenario: Producto seed sin imagen local disponible
- **WHEN** un cliente navega al catalogo y el producto no tiene `imagen_url` porque falto el asset de seed
- **THEN** el sistema muestra el placeholder existente sin romper la card ni el detalle
