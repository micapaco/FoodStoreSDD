# admin-usuarios-frontend Specification

## Purpose
TBD - created by archiving change admin-users. Update Purpose after archive.
## Requirements
### Requirement: Tabla paginada de usuarios
La página `/admin/usuarios` SHALL mostrar una tabla de usuarios con columnas: nombre completo, email, roles (badges), estado (activo/inactivo), fecha de registro.
La tabla SHALL soportar paginación con selector de página.
Solo accesible con rol ADMIN (ruta ya protegida por `RoleRoute`).

#### Scenario: Carga inicial
- **WHEN** ADMIN navega a `/admin/usuarios`
- **THEN** la tabla carga la primera página de usuarios con sus roles y estado

#### Scenario: Estado vacío
- **WHEN** no hay usuarios que coincidan con los filtros activos
- **THEN** la tabla muestra un mensaje "No se encontraron usuarios"

---

### Requirement: Búsqueda y filtro por rol
La página SHALL incluir un campo de búsqueda por nombre/email y un selector de rol.
Los cambios en búsqueda o filtro deben actualizar la tabla automáticamente (sin recargar la página).

#### Scenario: Búsqueda por texto
- **WHEN** ADMIN escribe en el campo de búsqueda
- **THEN** la tabla se actualiza mostrando solo usuarios que coincidan con el texto

#### Scenario: Filtro por rol
- **WHEN** ADMIN selecciona un rol del selector
- **THEN** la tabla muestra solo usuarios con ese rol asignado

---

### Requirement: Edición inline de usuario
La página SHALL permitir editar datos de un usuario mediante un modal o panel lateral.
Campos editables: nombre, apellido, email, teléfono.
Al guardar: optimistic update + invalidación del query.

#### Scenario: Edición exitosa
- **WHEN** ADMIN guarda cambios en el modal de edición
- **THEN** el sistema muestra los datos actualizados en la tabla y un toast de éxito

#### Scenario: Error de edición (email duplicado)
- **WHEN** ADMIN intenta guardar un email ya existente
- **THEN** el modal muestra el error HTTP 409 sin cerrarse

---

### Requirement: Cambio de roles de usuario
El modal de edición SHALL incluir un selector de rol único.
Los roles disponibles son: ADMIN, STOCK, PEDIDOS, CLIENT.
No debe permitir guardar sin rol seleccionado.

#### Scenario: Cambio de rol exitoso
- **WHEN** ADMIN modifica el rol y guarda
- **THEN** el frontend envía `{ roles: [rolSeleccionado] }`
- **AND** el sistema actualiza el rol y muestra el nuevo badge en la tabla

#### Scenario: Protección del último ADMIN
- **WHEN** ADMIN intenta quitar el rol ADMIN al único administrador
- **THEN** el backend rechaza la operación y el frontend muestra el error

### Requirement: Activar / desactivar usuario
La tabla SHALL mostrar un toggle (o botón) para activar/desactivar cada usuario.
El propio admin autenticado no puede desactivarse a sí mismo desde la UI.

#### Scenario: Desactivación exitosa
- **WHEN** ADMIN desactiva un usuario
- **THEN** la fila se actualiza mostrando el estado inactivo y un toast de confirmación

#### Scenario: Activación exitosa
- **WHEN** ADMIN activa un usuario inactivo
- **THEN** la fila se actualiza mostrando el estado activo

#### Scenario: Intento de desactivar al único ADMIN
- **WHEN** ADMIN intenta desactivar al único administrador
- **THEN** la UI muestra el error HTTP 409 del backend

