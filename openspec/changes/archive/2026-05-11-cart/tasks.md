## 1. Cart Store (Zustand)

- [x] 1.1 Crear `cartStore` en `app/shared/stores/cartStore.ts` con Zustand + persist middleware + partialize (solo items)
- [x] 1.2 Definir tipo `CartItem` con `{ producto_id, nombre, precio, cantidad, imagen_url, exclusiones: number[] }`
- [x] 1.3 Implementar acción `addItem(product, exclusiones?)` con merge por mismo producto_id+exclusiones
- [x] 1.4 Implementar acciones `removeItem(producto_id, exclusiones)` y `updateCantidad(producto_id, exclusiones, cantidad)`
- [x] 1.5 Implementar acción `clearCart()`
- [x] 1.6 Implementar getters computados `subtotal()`, `costoEnvio`, `total()` y `itemCount()`
- [x] 1.7 Configurar partialize para persistir solo `items[]` en localStorage

## 2. UI del Carrito (Drawer + Componentes)

- [x] 2.1 Crear componente `CartDrawer` con overlay + panel lateral deslizante desde la derecha
- [x] 2.2 Crear componente `CartItemCard` con nombre, precio, foto thumbnail, cantidad (+/–), exclusiones visibles
- [x] 2.3 Crear componente `CartSummary` con subtotal, costo de envío ($50.00) y total
- [x] 2.4 Implementar estado vacío: mensaje "Tu carrito está vacío" + link al catálogo
- [x] 2.5 Agregar botón "Ir al checkout" en el drawer que navega a `/checkout`
- [x] 2.6 Agregar indicador/badge en el header con `itemCount()` del cartStore

## 3. Personalización por Exclusiones

- [x] 3.1 Crear modal `PersonalizarProductoModal` con lista de ingredientes removibles del producto
- [x] 3.2 Integrar modal en el flujo "Agregar al carrito" desde catálogo/detalle
- [x] 3.3 Si el producto no tiene ingredientes removibles, agregar directo sin modal

## 4. Verificación

- [x] 4.1 Verificar que el carrito persiste en localStorage tras recargar página
- [x] 4.2 Verificar que los cómputos (subtotal, envío, total) son correctos
- [x] 4.3 Verificar que el badge del header se actualiza al agregar/remover items
- [x] 4.4 Verificar que el drawer abre/cierra correctamente
