## MODIFIED Requirements

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
