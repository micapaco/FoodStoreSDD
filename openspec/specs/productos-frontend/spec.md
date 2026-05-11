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
El sistema SHALL proveer un formulario para crear productos.

#### Scenario: Formulario de creación
- **WHEN** un usuario ADMIN navega a `/admin/productos/nuevo`
- **THEN** el sistema muestra un formulario con campos: nombre, descripción, precio_base, stock_cantidad, disponible (toggle), selector de categorías (árbol), selector de ingredientes con toggle es_removible

#### Scenario: Validación de campos
- **WHEN** el usuario envía el formulario con datos inválidos (precio negativo, nombre vacío)
- **THEN** el sistema muestra errores de validación sin enviar el request

#### Scenario: Creación exitosa
- **WHEN** el usuario completa el formulario correctamente y confirma
- **THEN** el sistema envía `POST /api/v1/productos` y redirige al listado con un toast de éxito

### Requirement: Editar producto
El sistema SHALL proveer un formulario para editar productos existentes.

#### Scenario: Formulario de edición
- **WHEN** un usuario ADMIN navega a `/admin/productos/{id}/editar`
- **THEN** el sistema carga los datos del producto y los muestra en el mismo formulario de creación precargados

#### Scenario: Edición exitosa
- **WHEN** el usuario modifica datos y confirma
- **THEN** el sistema envía `PUT /api/v1/productos/{id}` y redirige al listado con un toast de éxito

### Requirement: Detalle de producto (admin)
El sistema SHALL mostrar el detalle completo de un producto.

#### Scenario: Página de detalle
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/productos/{id}`
- **THEN** el sistema muestra: nombre, descripción, precio, stock, disponible, categorías (con badges), ingredientes (con badge de alérgeno y es_removible)

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
El sistema SHALL mostrar un catálogo público de productos para clientes.

#### Scenario: Grid de productos
- **WHEN** un cliente navega a `/productos`
- **THEN** el sistema muestra productos en un grid tipo tarjeta con: imagen placeholder, nombre, precio, badges de categorías, indicador de alérgenos
- **THEN** solo se muestran productos con `disponible=true`

#### Scenario: Filtros en catálogo público
- **WHEN** un cliente está en el catálogo público
- **THEN** el sistema muestra filtros: búsqueda por texto, categoría (select), rango de precio (slider o inputs)

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
