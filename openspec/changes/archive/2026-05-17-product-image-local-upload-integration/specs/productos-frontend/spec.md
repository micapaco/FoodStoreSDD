## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Catalogo con imagenes seed
El sistema SHALL mostrar las imagenes locales de seed cuando los productos las tengan asociadas.

#### Scenario: Producto seed con imagen local
- **WHEN** un cliente navega al catalogo y un producto seed tiene `imagen_url`
- **THEN** el sistema muestra la imagen servida por backend

#### Scenario: Producto seed sin imagen local disponible
- **WHEN** un cliente navega al catalogo y el producto no tiene `imagen_url` porque falto el asset de seed
- **THEN** el sistema muestra el placeholder existente sin romper la card ni el detalle
