## Context

El sistema ya cuenta con catálogo de productos funcional (change `08`), frontend shell con layout y navegación (change `04`), y direcciones de entrega (change `09`). El carrito de compras es el siguiente bloque necesario para habilitar el flujo de checkout.

Actualmente no existe estado de carrito en el frontend. Los productos se pueden ver en el catálogo pero no hay forma de seleccionarlos para una compra.

Restricciones relevantes:
- El carrito es **frontend-only** — no existe en backend (definido por las historias US-029 a US-034).
- Debe persistir en localStorage para sobrevivir a recargas de página.
- Soporta personalización por exclusión de ingredientes (IDs de ingredientes removidos).
- Costo de envío fijo: $50.00 (convención existente del proyecto).

## Goals / Non-Goals

**Goals:**
- Store Zustand `cartStore` con persistencia en localStorage, addItem/removeItem/updateCantidad/clearCart.
- Personalización por exclusión de ingredientes al agregar un producto.
- UI de carrito: indicador en header (badge con cantidad), drawer lateral con listado, resumen (subtotal, envío, total).
- Reglas client-side: mínimo 1 item, máximo 99 por producto, validación de stock visible.

**Non-Goals:**
- No se implementa checkout ni creación de pedidos (change futuro `12`).
- No se validan precios ni stock contra backend (change `11` — checkout-validation).
- No se implementa integración con MercadoPago.
- No hay backend involvement — cero cambios en API, modelos o base de datos.

## Decisions

1) **Arquitectura de estado: Zustand + persist + partialize**
   - Se crea `cartStore` siguiendo el patrón existente de authStore/cartStore/paymentStore/uiStore.
   - Middleware `persist` con `partialize` para guardar solo `items` en localStorage (no computados).
   - `items` es un array de `CartItem` con `{ producto_id, nombre, precio, cantidad, imagen_url, exclusiones: number[] }`.
   - `subtotal()`, `costoEnvio`, `total()` son getters computados (no persistidos).

2) **Persistencia solo en cliente**
   - Usar `localStorage` con clave `foodstore-cart`.
   - No se envía carrito al backend — no hay endpoint de sincronización.
   - Al hacer logout no se limpia el carrito (el usuario vuelve y lo encuentra).

3) **Personalización vía exclusiones**
   - `CartItem.exclusiones: number[]` almacena IDs de ingredientes que el usuario removió.
   - Se muestra en la UI como etiquetas "Sin {ingrediente}" en cada item.
   - Las exclusiones se eligen al agregar el producto (modal/select antes de confirmar).

4) **UI: Drawer lateral**
   - El carrito se muestra como drawer (panel deslizante desde la derecha).
   - Un badge en el header muestra la cantidad total de items.
   - El drawer contiene: lista de items con controles (+/-), exclusiones visibles, resumen con subtotal/costo envio/total, botón "Ir al checkout".
   - Estado vacío: drawer muestra mensaje "Tu carrito está vacío" con link al catálogo.

5) **Cómputo de totales**
   - `subtotal`: suma de `item.precio * item.cantidad` para todos los items.
   - `costoEnvio`: fijo $50.00 si hay al menos 1 item, $0 si está vacío.
   - `total`: subtotal + costoEnvio.

6) **Stock y disponibilidad**
   - Se muestra el stock disponible del producto, pero no se bloquea la compra — la validación real contra backend ocurre en checkout (change `11`).

## Risks / Trade-offs

- **[Pérdida de carrito]** si el usuario borra localStorage o cambia de navegador → **Mitigación**: es el comportamiento esperado; el carrito es client-side por diseño.
- **[Precio desactualizado]** si el admin cambia precios mientras el usuario tiene items en el carrito → **Mitigación**: se valida contra backend en checkout-validation (change `11`). El carrito muestra el precio al momento de agregar.
- **[Exclusiones huérfanas]** si un ingrediente se elimina del sistema mientras está excluido en un CartItem → **Mitigación**: el ID del ingrediente persiste, pero al mostrar la UI se verifica que exista (si no existe, se omite la etiqueta).
