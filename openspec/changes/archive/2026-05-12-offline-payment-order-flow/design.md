## Context

El sistema ya soporta tres formas de pago en el catalogo: `MERCADOPAGO`, `EFECTIVO` y `TRANSFERENCIA`. Sin embargo, el flujo implementado y documentado solo cierra la transicion `PENDIENTE -> CONFIRMADO` cuando MercadoPago informa `approved`. Para metodos offline, el pedido queda correctamente en `PENDIENTE`, pero hoy no existe una via contractual para validarlo despues.

El change debe conservar la semantica vigente de la FSM para no reescribir el dominio completo: `CONFIRMADO` representa pago validado, el descuento de stock ocurre al confirmar y la transicion manual generica a `CONFIRMADO` sigue bloqueada.

## Goals / Non-Goals

**Goals:**
- Definir una confirmacion offline explicita, autorizada y auditable.
- Mantener el descuento de stock y el historial append-only en la misma transaccion.
- Exponer una accion operativa entendible en el admin sin romper las reglas actuales de `order-fsm`.
- Diferenciar visualmente "pedido pendiente de validacion offline" de "pago MercadoPago en proceso".

**Non-Goals:**
- Subir comprobantes o adjuntos de transferencia.
- Modelar conciliacion bancaria, caja o arqueo.
- Crear un subsistema contable nuevo.
- Cambiar el significado global de todos los estados del pedido.
- Reemplazar MercadoPago o alterar sus webhooks.

## Decisions

### 1. Mantener `CONFIRMADO = pago validado`
Se conserva la semantica que ya aparece en `Integrador`, historias y specs archivadas. Cambiarla ahora implicaria redisenar FSM, stock, feedback post-checkout y pagos aprobados de MercadoPago.

**Alternativa descartada:** redefinir `CONFIRMADO` como "pedido aceptado por el local". Se descarta por mayor blast radius y por contradecir el contrato ya archivado.

### 2. Agregar una accion dedicada para pagos offline
La confirmacion offline no reutiliza la transicion manual generica `PATCH /api/v1/pedidos/{id}/estado`. Se propone un endpoint dedicado en el dominio de pedidos para expresar la intencion de negocio y preservar RN-FS02 para el flujo general.

Contrato esperado:
- actor: `ADMIN` o `PEDIDOS`
- pedido: `PENDIENTE`
- forma de pago: `EFECTIVO` o `TRANSFERENCIA`
- resultado: pedido `CONFIRMADO`, stock descontado, historial registrado

### 3. No crear filas `Pago` falsas para metodos offline
La tabla `Pago` vigente esta acoplada a MercadoPago (`mp_payment_id`, `mp_status`, etc.). Forzar registros dummy degradaria el modelo. La confirmacion offline queda auditada en el historial del pedido y podra evolucionar en un change futuro si se crea un modelo de cobros mas general.

### 4. UI admin guiada por elegibilidad
La vista operativa solo mostrara "Confirmar pago offline" cuando el pedido cumpla forma de pago y estado. Los pedidos MercadoPago conservaran su lectura de pago actual sin recibir esa accion.

### 5. Mensajeria mas precisa
Las vistas de cliente/admin deben distinguir:
- MercadoPago pendiente o en proceso.
- Efectivo/transferencia pendiente de validacion operativa.
- Pedido confirmado una vez que el pago se valida.

## Risks / Trade-offs

- [Risk] Confirmar offline sin comprobacion real fuera del sistema. -> Mitigacion: limitar a roles operativos y registrar actor/historial.
- [Risk] Doble confirmacion concurrente. -> Mitigacion: validar estado `PENDIENTE` y ejecutar la transicion en UoW con las mismas garantias de stock ya usadas por la confirmacion automatica.
- [Risk] Divergencia entre copy de UI y contrato backend. -> Mitigacion: definir escenarios frontend en spec y centralizar mensajes alrededor de `formaPagoCodigo` + estado.
- [Risk] Crecimiento futuro de pagos offline hacia conciliacion mas rica. -> Mitigacion: dejar explicitamente fuera de alcance y no contaminar `Pago` con datos provisionales.

## Migration Plan

1. Aprobar el contrato OpenSpec y actualizar roadmap/documentacion de coordinacion.
2. Implementar backend dedicado para confirmar pagos offline, reutilizando la logica de confirmacion de pedido donde sea seguro.
3. Agregar controles frontend en admin y copy de estado.
4. Cubrir tests de autorizacion, elegibilidad, stock e historial.
5. Validar OpenSpec, backend y frontend antes de archivar.

Rollback: revertir el endpoint y la UI de confirmacion offline; el modelo de datos actual no requiere migracion para volver al comportamiento previo.

## Open Questions

- Nombre final del endpoint dedicado dentro del modulo `pedidos`.
- Si `PEDIDOS` y `ADMIN` comparten exactamente el mismo alcance para confirmar `TRANSFERENCIA` y `EFECTIVO`, o si el proyecto quiere restringir alguno de esos medios solo a `ADMIN`.
