# cocina-frontend Specification

## Purpose
Define el contrato frontend para el Kitchen Display System (KDS): pantalla en `/cocina`, columnas de estado, actualización en tiempo real vía WebSocket, resiliencia ante desconexión, timer de urgencia y alerta sonora/visual.

## Requirements

### Requirement: Pantalla KDS en /cocina
El sistema SHALL proveer una pantalla dedicada en `/cocina` accesible para roles `COCINA`, `PEDIDOS` y `ADMIN`, que muestre los pedidos activos de cocina en tiempo real.

#### Scenario: Acceso autenticado con rol COCINA
- **WHEN** un usuario con rol `COCINA` navega a `/cocina`
- **THEN** el sistema muestra la pantalla KDS con los pedidos activos cargados

#### Scenario: Acceso con rol PEDIDOS o ADMIN
- **WHEN** un usuario con rol `PEDIDOS` o `ADMIN` navega a `/cocina`
- **THEN** el sistema permite el acceso y muestra la pantalla KDS

#### Scenario: Acceso denegado a otros roles
- **WHEN** un usuario con rol `CLIENT` o `STOCK` intenta acceder a `/cocina`
- **THEN** el sistema redirige a `/403` (guard de ruta)

#### Scenario: /cocina excluida del auto-logout por inactividad
- **WHEN** el usuario está en `/cocina` sin interacción durante el tiempo de inactividad
- **THEN** el sistema NO ejecuta el auto-logout (la pantalla de cocina vive encendida durante el turno)

---

### Requirement: Columnas de estado en el KDS
El sistema SHALL mostrar los pedidos organizados en dos columnas: "Por preparar" (`CONFIRMADO`) y "En preparación" (`EN_PREP`), ordenados por antigüedad ascendente dentro de cada columna.

#### Scenario: Carga inicial de pedidos
- **WHEN** la pantalla KDS monta
- **THEN** el sistema hace `GET /api/v1/cocina/pedidos` y muestra los pedidos en sus columnas correspondientes

#### Scenario: Tarjeta de pedido
- **WHEN** un pedido aparece en el KDS
- **THEN** cada tarjeta muestra: número de pedido, lista de ítems con `nombre_snapshot` × `cantidad`, exclusiones de ingredientes de `personalizacion`, `notas` del pedido (nivel pedido) y el timer de urgencia
- **THEN** cada ítem de la tarjeta muestra sus `notas` propias debajo de las exclusiones de ingredientes, si `item.notas` es no vacío

#### Scenario: Notas por item visibles en el KDS
- **WHEN** un ítem del pedido tiene `notas` no nulas y no vacías
- **THEN** el KDS muestra el texto de notas debajo de los ingredientes excluidos de ese ítem
- **THEN** el estilo visual de `item.notas` es consistente con el de las exclusiones de ingredientes (mismo nivel de énfasis, texto secundario)
- **WHEN** un ítem no tiene notas
- **THEN** no se renderiza ningún elemento adicional para ese ítem

#### Scenario: Acción "Iniciar preparación"
- **WHEN** el cocinero presiona "Iniciar preparación" en un pedido `CONFIRMADO`
- **THEN** el sistema llama `PATCH /api/v1/pedidos/{id}/estado` con `nuevoEstado=EN_PREP`
- **THEN** la tarjeta se mueve a la columna "En preparación"

#### Scenario: Acción "Listo"
- **WHEN** el cocinero presiona "Listo" en un pedido `EN_PREP`
- **THEN** el sistema llama `PATCH /api/v1/pedidos/{id}/estado` con `nuevoEstado=EN_CAMINO`
- **THEN** la tarjeta desaparece del KDS

---

### Requirement: Actualización en tiempo real vía WebSocket
El sistema SHALL mantener una conexión WebSocket con el backend y actualizar el KDS sin recargar la página.

#### Scenario: Nuevo pedido confirmado llega por push
- **WHEN** el backend emite `PEDIDO_CONFIRMADO`
- **THEN** aparece una tarjeta nueva en la columna "Por preparar" sin recargar

#### Scenario: Pedido pasa a EN_PREP por push
- **WHEN** el backend emite `PEDIDO_EN_PREPARACION`
- **THEN** la tarjeta se mueve a "En preparación" en todas las pantallas conectadas

#### Scenario: Pedido sale de cocina por push
- **WHEN** el backend emite `PEDIDO_EN_CAMINO` o `PEDIDO_CANCELADO`
- **THEN** la tarjeta desaparece del KDS

---

### Requirement: Resiliencia ante desconexión del WebSocket
El sistema SHALL detectar la desconexión del WebSocket y activar un modo de polling de respaldo.

#### Scenario: WebSocket desconectado
- **WHEN** el WebSocket se desconecta
- **THEN** el KDS muestra un indicador visual de "sin conexión en vivo"
- **THEN** el sistema activa polling a `GET /api/v1/cocina/pedidos` cada 30 segundos

#### Scenario: Reconexión del WebSocket
- **WHEN** el WebSocket reconecta
- **THEN** el sistema hace un fetch completo del estado actual, desactiva el polling y vuelve al modo push
- **THEN** el indicador de "sin conexión" desaparece

---

### Requirement: Timer de urgencia visual
El sistema SHALL mostrar en cada tarjeta el tiempo transcurrido desde la entrada del pedido a cocina y aplicar estilos visuales según umbrales de urgencia.

#### Scenario: Pedido reciente
- **WHEN** un pedido lleva menos de 10 minutos en cocina
- **THEN** el timer se muestra con estilo normal

#### Scenario: Pedido demorado
- **WHEN** un pedido lleva entre 10 y 20 minutos en cocina
- **THEN** el timer se muestra en color advertencia (naranja)

#### Scenario: Pedido urgente
- **WHEN** un pedido lleva más de 20 minutos en cocina
- **THEN** el timer se muestra en color urgente (rojo)

#### Scenario: Timer se actualiza sin recargar
- **WHEN** pasan 15 segundos
- **THEN** el timer de cada tarjeta se recalcula y actualiza en el cliente sin hacer requests al backend

---

### Requirement: Alerta sonora y visual al recibir pedido nuevo
El sistema SHALL emitir una alerta sonora (beep) y un flash visual cuando llegue un evento `PEDIDO_CONFIRMADO`, si el sonido está activado.

#### Scenario: Alerta al llegar pedido nuevo con sonido activado
- **WHEN** el KDS recibe `PEDIDO_CONFIRMADO` y el toggle de sonido está ON
- **THEN** el sistema reproduce un beep generado con Web Audio API (sin archivos externos)
- **THEN** la pantalla hace un flash visual breve

#### Scenario: Toggle de sonido persistido
- **WHEN** el usuario cambia el estado del toggle de sonido
- **THEN** el valor se persiste en `localStorage` y se restaura al recargar

#### Scenario: Primer uso requiere interacción previa
- **WHEN** el KDS carga por primera vez sin interacción del usuario
- **THEN** el sonido no se activa automáticamente (restricción de autoplay del navegador)
- **THEN** se muestra un botón o indicador para activar el audio
