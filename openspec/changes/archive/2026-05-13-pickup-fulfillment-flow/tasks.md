## 1. Contract And Documentation

- [x] 1.1 Validar la propuesta `pickup-fulfillment-flow` y resolver observaciones de OpenSpec.
- [x] 1.2 Ajustar specs y docs de roadmap para dejar explicita la regla `direccion_id=NULL -> retiro en local`.
- [x] 1.3 Confirmar copy y etiquetas operativas que usara frontend para retiro en local.

## 2. Backend Pickup Fulfillment

- [x] 2.1 Ajustar el calculo de `costo_envio` y `total` para persistir envio `0` en pedidos de retiro en local.
- [x] 2.2 Mantener el costo vigente para pedidos con direccion de entrega.
- [x] 2.3 Extender la validacion FSM para permitir `EN_PREP -> ENTREGADO` solo en retiro en local.
- [x] 2.4 Rechazar `EN_PREP -> EN_CAMINO` en retiro en local y rechazar cierres que salteen `EN_CAMINO` en entregas a domicilio.
- [x] 2.5 Agregar tests backend de totales, historial y transiciones por modalidad.

## 3. Frontend Pickup UX

- [x] 3.1 Ajustar checkout para reflejar retiro en local con envio `0` y total coherente.
- [x] 3.2 Mostrar modalidad y costo correcto en detalle de pedido.
- [x] 3.3 Adaptar `/admin/pedidos` para ofrecer acciones distintas segun retiro local o entrega a domicilio.
- [x] 3.4 Mostrar feedback de error si el backend rechaza una transicion incompatible.

## 4. Verification

- [x] 4.1 Ejecutar tests backend y build frontend.
- [x] 4.2 Validar OpenSpec del change en modo estricto.
- [x] 4.3 Verificar manualmente pedidos con entrega y retiro en local de punta a punta.
