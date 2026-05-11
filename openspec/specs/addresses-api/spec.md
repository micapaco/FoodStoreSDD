## ADDED Requirements

### Requirement: CRUD de direcciones de entrega (CLIENT)
El sistema SHALL permitir a un usuario autenticado con rol `CLIENT` gestionar sus direcciones de entrega.

#### Scenario: Listar direcciones propias
- **WHEN** un usuario autenticado envía `GET /api/v1/direcciones?page=1&page_size=10`
- **THEN** el sistema responde `200 OK` con una respuesta paginada `{items, page, page_size, total}`
- **THEN** cada item incluye al menos `{id, alias, linea1, linea2, ciudad, provincia, codigo_postal, notas, es_principal}`

#### Scenario: Obtener dirección por id
- **WHEN** un usuario autenticado envía `GET /api/v1/direcciones/{id}`
- **THEN** el sistema responde `200 OK` con la dirección

#### Scenario: Crear dirección
- **WHEN** un usuario autenticado envía `POST /api/v1/direcciones` con un body válido
- **THEN** el sistema responde `201 Created` con la dirección creada

#### Scenario: Actualizar dirección
- **WHEN** un usuario autenticado envía `PUT /api/v1/direcciones/{id}` con un body válido
- **THEN** el sistema responde `200 OK` con la dirección actualizada

#### Scenario: Eliminar dirección
- **WHEN** un usuario autenticado envía `DELETE /api/v1/direcciones/{id}`
- **THEN** el sistema responde `204 No Content`

---

### Requirement: Ownership estricto de direcciones
El sistema SHALL asegurar que un usuario `CLIENT` solo puede ver y operar sobre sus propias direcciones (RN-DI03).

#### Scenario: Acceso a dirección de otro usuario
- **WHEN** un usuario autenticado intenta `GET/PUT/DELETE/PATCH` sobre `/api/v1/direcciones/{id}` que pertenece a otro usuario
- **THEN** el sistema responde `404 Not Found`

---

### Requirement: Dirección principal única por usuario
El sistema SHALL garantizar que solo una dirección puede ser principal por usuario (RN-DI02).

#### Scenario: Primera dirección se marca principal automáticamente
- **WHEN** un usuario crea su primera dirección mediante `POST /api/v1/direcciones`
- **THEN** el sistema responde con `es_principal=true` para la dirección creada

#### Scenario: Marcar una dirección como principal
- **WHEN** un usuario autenticado envía `PATCH /api/v1/direcciones/{id}/principal`
- **THEN** el sistema responde `200 OK` con la dirección marcada como principal
- **THEN** el sistema asegura que todas las demás direcciones del usuario quedan con `es_principal=false`

#### Scenario: Marcar principal una dirección inexistente
- **WHEN** un usuario autenticado envía `PATCH /api/v1/direcciones/{id}/principal` y la dirección no existe (o no es propia)
- **THEN** el sistema responde `404 Not Found`

---

### Requirement: Validación de payloads de dirección
El sistema SHALL validar los campos del request para crear/actualizar direcciones.

#### Scenario: Payload inválido
- **WHEN** un usuario envía `POST /api/v1/direcciones` con campos requeridos faltantes o inválidos
- **THEN** el sistema responde `422 Unprocessable Entity`

#### Scenario: Campos requeridos en create/update
- **WHEN** un usuario envía `POST /api/v1/direcciones` o `PUT /api/v1/direcciones/{id}` con un body válido
- **THEN** el request incluye los campos requeridos `{alias, linea1, linea2, ciudad, provincia, codigo_postal, notas}`
