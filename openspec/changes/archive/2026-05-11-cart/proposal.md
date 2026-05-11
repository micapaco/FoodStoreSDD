## Why

Los clientes necesitan un carrito de compras client-side que les permita agregar productos, personalizarlos (excluir ingredientes), ver el resumen y total antes de pasar al checkout. El carrito debe persistir en localStorage para mantener el estado entre sesiones sin depender del backend.

## What Changes

- Se crea un store Zustand (`cartStore`) para el carrito con persistencia en localStorage y partialize para solo items.
- Se implementa la UI del carrito: indicador de items en el header, drawer lateral con resumen y totales.
- Se agrega personalización por exclusión de ingredientes al agregar productos al carrito.
- Se implementan las reglas client-side del carrito (mínimo 1 item, límite de cantidad, etc.).
- No se toca backend — el carrito es 100% frontend.

## Capabilities

### New Capabilities
- `cart-store`: Store Zustand del carrito con persistencia, partialize, addItem/removeItem/updateCantidad/clearCart, personalización por exclusión de ingredientes, y cómputo de subtotal/envío/total.
- `cart-frontend`: UI del carrito: indicador de items (header badge), drawer lateral con listado de items, controles de cantidad, exclusiones visibles, resumen con subtotal/costo envio/total, y botón de checkout.

### Modified Capabilities
*(ninguna — es capability nueva, no modifica specs existentes)*

## Impact

- Frontend: nuevo store `cartStore` en `app/shared/stores/cartStore.ts` (Zustand + persist middleware + partialize).
- Frontend: nuevo feature `cart/` con componentes CartDrawer, CartItemCard, CartSummary y hooks asociados.
- Frontend: posible badge/indicador en el header existente (shell layout) para mostrar cantidad de items.
- Frontend: TanStack Query no se usa (el carrito es puramente client-side, no hay server state involucrado).
- No hay impacto en backend, API, base de datos ni migraciones.
