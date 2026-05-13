## Context

Food Store ya documenta que `direccion_id=NULL` es valido y representa `retiro en local`. Sin embargo, los contratos archivados de pedidos mantienen dos supuestos globales que solo sirven para entrega a domicilio:

- `costo_envio` fijo aplicado a todo pedido.
- avance operativo universal `EN_PREP -> EN_CAMINO -> ENTREGADO`.

El resultado es doblemente incoherente: se cobra envio donde no existe despacho y la administracion ve una etapa "en camino" para un pedido que permanece en el local hasta ser retirado.

## Goals / Non-Goals

**Goals:**
- Corregir el contrato de costo final para retiro en local.
- Ajustar la FSM operativa sin reabrir el significado global de los seis estados existentes.
- Hacer que el admin vea solo acciones compatibles con la modalidad del pedido.
- Alinear checkout y detalle con el total que el backend persiste.

**Non-Goals:**
- Crear un nuevo estado `LISTO_PARA_RETIRO`.
- Modelar ventanas horarias, mensajeria o repartidores.
- Hacer configurable el importe de envio en este change.
- Replantear el flujo de confirmacion de pagos offline archivado en `15.5`.

## Decisions

### 1. La modalidad se deriva de `direccion_id`
No se agrega una columna nueva. El contrato existente ya expresa la regla:
- `direccion_id=NULL` -> retiro en local.
- `direccion_id!=NULL` -> entrega a domicilio.

Esto evita migraciones innecesarias y conserva compatibilidad con el modelo archivado.

### 2. Retiro en local no cobra envio
Para pedidos de retiro en local, el backend persiste:
- `costo_envio=0`
- `total=subtotal`

Para pedidos con direccion de entrega, se conserva el costo de envio vigente que el sistema ya usa. El backend sigue siendo la fuente de verdad del monto final.

### 3. Se conserva la FSM de seis estados, pero se bifurca el tramo operativo
No se introduce un estado nuevo. La variante queda:
- entrega a domicilio: `EN_PREP -> EN_CAMINO -> ENTREGADO`
- retiro en local: `EN_PREP -> ENTREGADO`

`ENTREGADO` en retiro en local significa que el cliente efectivamente recibio el pedido en mostrador. Mientras el pedido este preparado pero aun no fue retirado, puede permanecer en `EN_PREP` dentro del alcance actual.

### 4. Las transiciones incompatibles se rechazan explicitamente
El backend debe impedir:
- `EN_PREP -> EN_CAMINO` en retiro en local.
- `EN_PREP -> ENTREGADO` en entregas a domicilio si se intenta saltear `EN_CAMINO`.

Esto mantiene la FSM auditable y evita que la UI sea la unica defensa.

### 5. La UI muestra acciones derivadas del contrato, no inventadas
El panel operativo debe ofrecer:
- "Marcar en camino" solo para entregas a domicilio en `EN_PREP`.
- accion de cierre directa hacia `ENTREGADO` para retiro en local en `EN_PREP`.

Checkout y detalle deben mostrar "Retiro en local" y costo de envio `0` cuando corresponda, alineados con el response backend.

## Risks / Trade-offs

- [Risk] `EN_PREP` puede representar tanto "en cocina" como "listo para retirar" en el flujo de pickup. -> Mitigacion: documentar que no existe un estado intermedio nuevo en este change; si el negocio necesita distinguirlo, se propone otro change.
- [Risk] Divergencia temporal entre total visible en frontend y total persistido por backend. -> Mitigacion: checkout debe reflejar la modalidad elegida y el backend sigue siendo autoridad final.
- [Risk] Reglas de transicion dispersas entre UI y backend. -> Mitigacion: la regla vive primero en `pedidos-api`; frontend solo presenta acciones que el contrato permite.

## Migration Plan

1. Aprobar el contrato OpenSpec y dejar trazado el nuevo change en roadmap/AGENTS.
2. Implementar backend de costo y validacion FSM por modalidad.
3. Ajustar checkout, detalle y panel operativo para totals/acciones correctas.
4. Cubrir tests backend y verificaciones frontend/manuales.
5. Validar OpenSpec antes de archivar.

Rollback: revertir el calculo condicional de costo y las ramas operativas por modalidad. No se prevé migracion estructural de base de datos.

## Open Questions

- Si mas adelante el negocio quiere separar "pedido listo para retirar" de "pedido aun en preparacion", se evaluara un change especifico con nuevo estado o subestado operativo.
