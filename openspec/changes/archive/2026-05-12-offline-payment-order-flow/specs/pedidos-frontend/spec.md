## MODIFIED Requirements

### Requirement: Panel operativo de pedidos
El frontend SHALL reemplazar el placeholder de `/admin/pedidos` por una vista funcional para `ADMIN` y `PEDIDOS`, incluyendo acciones coherentes con la forma de pago del pedido.

#### Scenario: Operador confirma pago offline elegible
- **WHEN** el detalle operativo muestra un pedido `PENDIENTE` con `formaPagoCodigo=EFECTIVO|TRANSFERENCIA`
- **THEN** la interfaz ofrece una accion visible para confirmar el pago offline
- **THEN** al completarse la mutacion se refrescan listado y detalle

#### Scenario: Operador no ve confirmacion offline en MercadoPago
- **WHEN** el detalle operativo muestra un pedido `MERCADOPAGO`
- **THEN** la interfaz no ofrece la accion de confirmacion offline

#### Scenario: Operador recibe feedback de error
- **WHEN** la confirmacion offline falla por permisos, estado invalido o conflicto de negocio
- **THEN** la interfaz muestra un mensaje accionable sin desincronizar la vista

---

## ADDED Requirements

### Requirement: Frontend de pedidos comunica estados de pago sin ambiguedad
El frontend SHALL distinguir estados pendientes segun el metodo de pago para evitar que `PENDIENTE` se interprete como fallo o ausencia de gestion.

#### Scenario: Pedido MercadoPago pendiente
- **WHEN** un pedido usa `MERCADOPAGO` y sigue pendiente de aprobacion
- **THEN** la interfaz comunica que el pago esta pendiente o en proceso segun los datos disponibles

#### Scenario: Pedido offline pendiente
- **WHEN** un pedido usa `EFECTIVO` o `TRANSFERENCIA` y esta `PENDIENTE`
- **THEN** la interfaz comunica que queda pendiente de validacion operativa del pago offline

#### Scenario: Pedido confirmado
- **WHEN** un pedido alcanza `CONFIRMADO`
- **THEN** la interfaz comunica que el pago quedo validado conforme al contrato vigente
