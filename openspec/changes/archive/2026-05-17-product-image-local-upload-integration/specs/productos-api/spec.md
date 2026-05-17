## MODIFIED Requirements

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

## ADDED Requirements

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
