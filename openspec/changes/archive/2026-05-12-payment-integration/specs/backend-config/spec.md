## ADDED Requirements

### Requirement: Configuracion MercadoPago
El backend SHALL exponer configuracion tipada para credenciales y URLs necesarias de MercadoPago sin hardcodear secretos.

#### Scenario: Variables requeridas para pagos
- **WHEN** el modulo de pagos se inicializa
- **THEN** usa `MERCADOPAGO_ACCESS_TOKEN` para llamadas server-side
- **THEN** usa `MERCADOPAGO_PUBLIC_KEY` solo como configuracion publica/documentada
- **THEN** usa `MERCADOPAGO_WEBHOOK_SECRET` para validar firma de webhooks
- **THEN** usa `MERCADOPAGO_NOTIFICATION_URL` para construir URLs de notificacion cuando MercadoPago lo requiera

#### Scenario: Entorno sin credenciales
- **WHEN** faltan credenciales MercadoPago y se intenta crear un pago real
- **THEN** el backend responde un error controlado
- **THEN** no persiste intentos de pago incompletos
