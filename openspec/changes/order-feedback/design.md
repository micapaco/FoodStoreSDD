# Design — order-feedback

## Flujo

```
CheckoutPage — pedido creado exitosamente
    → navigate(`/pedidos/${pedido.id}/confirmacion`)

OrderConfirmationPage (/pedidos/:id/confirmacion)
    → useParams({ id })
    → usePedidoDetalle(pedidoId)          ← hook existente
    → render: resumen, dirección, acciones
    → si formaPagoCodigo === 'MERCADOPAGO' → MercadoPagoCardPayment
```

## Archivos afectados

| Acción | Archivo |
|--------|---------|
| CREAR | `frontend/src/pages/OrderConfirmationPage.tsx` |
| MODIFICAR | `frontend/src/app/router.tsx` |
| MODIFICAR | `frontend/src/pages/CheckoutPage.tsx` |

## OrderConfirmationPage — estructura

- Lee `id` de URL params → `usePedidoDetalle(pedidoId)`
- Loading / error state
- Sección header: "Pedido #N — PENDIENTE — Esperando pago"
- Sección ítems: lista con `nombreSnapshot × cantidad = subtotal`
- Sección totales: costo de envío + total
- Sección entrega: dirección snapshot o "Retiro en local" si `direccionSnapshot === null`
- Acciones: "Ver detalle del pedido" (`/pedidos/:id`) + "Mis pedidos" (`/pedidos`)
- Si MERCADOPAGO: `<MercadoPagoCardPayment pedido={pedido} />`

## CheckoutPage — cambios

- Eliminar estado `pedidoCreado` y el bloque `if (pedidoCreado)` (render inline)
- Agregar `useNavigate`
- Post-creación: `navigate(`/pedidos/${pedido.id}/confirmacion`)`
- Mantener `startCheckoutPayment()` antes de navegar si MERCADOPAGO

## Ruta nueva

```
/pedidos/:id/confirmacion   → OrderConfirmationPage   (CLIENT role)
```

## Contratos API usados

- `GET /pedidos/:id` → `PedidoDetailRead` (ya existe, hook `usePedidoDetalle`)
- Sin endpoints nuevos
