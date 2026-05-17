## ADDED Requirements

### Requirement: Gestion administrativa de ingredientes
El sistema SHALL permitir que usuarios ADMIN y STOCK gestionen ingredientes desde una vista web dedicada.

#### Scenario: Acceso a la vista de ingredientes
- **WHEN** un usuario ADMIN o STOCK navega a `/admin/ingredientes`
- **THEN** el sistema muestra la vista de administracion de ingredientes
- **AND** la navegacion privada incluye un link visible a `Ingredientes`

#### Scenario: Listado paginado
- **WHEN** un usuario ADMIN o STOCK abre la vista
- **THEN** el sistema solicita `GET /api/v1/ingredientes` con `page` y `size`
- **AND** muestra los ingredientes activos con controles de paginacion basados en `total` y `pages`

#### Scenario: Buscar ingrediente por nombre
- **WHEN** el usuario escribe un termino en el buscador
- **THEN** el sistema solicita el listado con `q=<termino>`
- **AND** muestra solo resultados coincidentes sin traer todos los ingredientes de una

#### Scenario: Filtrar por alergeno
- **WHEN** el usuario activa el filtro de alergenos
- **THEN** el sistema solicita el listado con `alergeno=true`
- **AND** permite combinar ese filtro con busqueda y paginacion

#### Scenario: Crear ingrediente
- **WHEN** un usuario ADMIN o STOCK crea un ingrediente con `nombre` y `es_alergeno`
- **THEN** el sistema envia `POST /api/v1/ingredientes`
- **AND** refresca el listado de ingredientes

#### Scenario: Editar ingrediente
- **WHEN** un usuario ADMIN o STOCK modifica nombre o flag de alergeno de un ingrediente
- **THEN** el sistema envia `PUT /api/v1/ingredientes/{id}`
- **AND** refresca el listado de ingredientes

#### Scenario: Eliminar ingrediente
- **WHEN** un usuario ADMIN o STOCK confirma la eliminacion de un ingrediente
- **THEN** el sistema envia `DELETE /api/v1/ingredientes/{id}`
- **AND** remueve el ingrediente del listado activo tras refrescar datos

#### Scenario: Ingrediente disponible para productos
- **WHEN** se crea o edita un ingrediente desde la vista administrativa
- **THEN** los formularios de productos que consumen ingredientes reciben datos actualizados al refrescar o reabrirse

#### Scenario: Selector de ingredientes en producto con buscador y paginado
- **WHEN** un usuario ADMIN crea o edita un producto con muchos ingredientes disponibles
- **THEN** el selector de ingredientes permite buscar por nombre
- **AND** muestra los resultados en paginas en lugar de renderizar todos los ingredientes en una sola lista
- **AND** conserva las selecciones realizadas aunque el usuario cambie de pagina o busqueda
