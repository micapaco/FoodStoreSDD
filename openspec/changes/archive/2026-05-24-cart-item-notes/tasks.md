## 0. Backend — Modelo ORM

- [x] 0.1 Agregar `notas: Optional[str]` (Text nullable) a `DetallePedido` en `backend/app/db/models/ventas.py`

## 1. Backend — Schemas

- [x] 1.1 Agregar `notas: str | None` a `ItemPedidoRequest` en `backend/app/modules/pedidos/schemas.py` (con validator que normalice a None si está vacío)
- [x] 1.2 Agregar `notas: str | None` a `PedidoDetalleItemRead` en `backend/app/modules/pedidos/schemas.py`
- [x] 1.3 Agregar `notas: str | None` a `ItemCocinaRead` en `backend/app/modules/cocina/schemas.py`

## 2. Backend — Service

- [x] 2.1 Agregar `notas: str | None` al dataclass `PreparedPedidoItem` en `backend/app/modules/pedidos/service.py`
- [x] 2.2 En `_prepare_item`, incluir `notas=item.notas` en el `PreparedPedidoItem` retornado (normalizar a None si es vacío)
- [x] 2.3 En `_create_detalles`, pasar `notas=item.notas` al construir cada `DetallePedido`

## 3. Backend — Router Cocina

- [x] 3.1 En `backend/app/modules/cocina/router.py`, pasar `notas=d.notas` al construir `ItemCocinaRead` (en ambos lugares: `build_pedido_cocina_read` y `listar_pedidos_activos`)

## 4. Backend — Migración Alembic

- [x] 4.1 Crear migración Alembic que agrega columna `notas TEXT nullable` a la tabla `detalle_pedido`

## 5. Frontend — Tipos y Store

- [x] 5.1 Agregar `notas?: string` a la interfaz `Personalizacion` en `frontend/src/shared/types/cart.ts`
- [x] 5.2 Actualizar `matchItem` en `frontend/src/shared/stores/cartStore.ts` para comparar `personalizacion.notas` además de `ingredientesExcluidos`
- [x] 5.3 Agregar `notas: string | null` a `ItemCocinaRead` en `frontend/src/entities/cocina/types.ts`

## 6. Frontend — Modal de personalización

- [x] 6.1 Agregar `<textarea>` de notas en `PersonalizarProductoModal.tsx` bajo la lista de ingredientes excluidos
- [x] 6.2 Conectar el textarea al estado local y pasarlo en `personalizacion.notas` al confirmar (undefined si vacío)
- [x] 6.3 Resetear el campo de notas al cerrar o confirmar el modal

## 7. Frontend — CartItemCard

- [x] 7.1 En `CartItemCard.tsx`, mostrar `item.personalizacion.notas` debajo de las exclusiones si existe (read-only)
- [x] 7.2 No renderizar nada si `notas` es undefined o string vacío

## 8. Frontend — Checkout payload

- [x] 8.1 En `CheckoutPage.tsx`, agregar `notas: item.personalizacion?.notas?.trim() || null` al mapeo de ítems en `pedidoRequest`

## 9. Frontend — KDSCard

- [x] 9.1 En `KDSCard.tsx`, mostrar `item.notas` debajo de los ingredientes excluidos de cada ítem
- [x] 9.2 No renderizar nada si `item.notas` es null o vacío
- [x] 9.3 Aplicar estilo visual consistente con el resto del card (texto secundario, italic)
