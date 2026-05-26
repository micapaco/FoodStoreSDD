## Why

El cliente no tiene forma de agregar indicaciones especiales por producto al momento de agregar al carrito (ej. "sin sal", "extra queso", "término medio"). Esta información es crítica para la cocina y actualmente se pierde — el cocinero no sabe cómo preparar el plato según la preferencia del cliente.

## What Changes

- Se agrega un campo de texto libre `notas` por ítem en el carrito
- El campo viaja en el payload de creación de pedido (igual que `ingredientes_excluidos`)
- Se persiste en la tabla `pedido_item` como columna `notas`
- Se muestra en cada card del KDS (cocina) bajo los ingredientes excluidos
- Se muestra en la vista de detalle de pedido del admin

## Capabilities

### New Capabilities
- ninguna — es una extensión de capacidades existentes

### Modified Capabilities
- `cart-store`: el store de carrito agrega `notas?: string` a cada ítem
- `cart-frontend`: la UI del carrito y el modal de personalización agregan un input de notas
- `pedidos-api`: el payload `CrearPedidoRequest.items[].notas` se persiste en `pedido_item.notas`
- `cocina-frontend`: el KDS muestra `notas` en cada card si está presente
- `pedidos-frontend`: el detalle de pedido del admin muestra `notas` por ítem

## Impact

- `frontend/src/shared/stores/cartStore.ts` — agregar campo `notas` al tipo de ítem
- `frontend/src/features/store/components/PersonalizarProductoModal.tsx` — agregar input de notas
- `frontend/src/features/store/components/CartDrawer.tsx` — mostrar notas en vista previa
- `frontend/src/entities/pedidos/types.ts` — agregar `notas` al tipo de ítem de pedido
- `backend/app/modules/pedidos/` — schemas y modelo `pedido_item` con columna `notas`
- `backend/app/modules/cocina/schemas.py` — incluir `notas` en respuesta del KDS
- `frontend/src/features/cocina/components/KDSCard.tsx` — mostrar notas
- Migración de base de datos: nueva columna `notas` nullable en `pedido_item`
