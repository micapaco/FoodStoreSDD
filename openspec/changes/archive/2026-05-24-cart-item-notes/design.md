## Context

El backend ya tiene `notas` implementado en `PedidoItemCreate`, `PedidoItemRead` y `PedidoCocinaItemRead`. Los tipos frontend en `entities/pedidos/types.ts` y `entities/cocina/types.ts` también lo tienen. Lo que falta es la capa de presentación: el campo no existe en `CartItem`/`Personalizacion`, no hay UI para ingresarlo, y el KDS muestra `pedido.notas` (nivel pedido) pero no las notas por ítem.

## Goals / Non-Goals

**Goals:**
- Agregar `notas` a `Personalizacion` y al matching del cartStore
- Agregar input de texto libre en `PersonalizarProductoModal`
- Mostrar notas en `CartDrawer` por ítem
- Pasar `notas` en el payload de checkout al backend
- Mostrar `notas` por ítem en `KDSCard`

**Non-Goals:**
- Cambios en el backend (ya implementado)
- Migración de base de datos (columna ya existe según schemas)
- Cambios en la vista de admin de pedidos (out of scope v1)

## Decisions

### D-1: `notas` va dentro de `Personalizacion`, no como campo separado de `CartItem`

`notas` es una instrucción de preparación, igual que `ingredientesExcluidos`. Mantenerlo en `Personalizacion` es consistente con el modelo actual y simplifica el checkout (ya se mapea `personalizacion` completo al backend).

**Alternativa descartada:** campo `notas` directo en `CartItem`. Rompe la cohesión del objeto de personalización y requiere más cambios en el matching.

### D-2: Actualizar `matchItem` para incluir `notas` en la comparación

Dos ítems del mismo producto con notas diferentes deben ser ítems **distintos** en el carrito (igual que dos ítems con distintos ingredientes excluidos). La función `matchItem` en `cartStore.ts` debe comparar `notas` además de `ingredientesExcluidos`.

### D-3: Input en `PersonalizarProductoModal`, no inline en `CartDrawer`

El modal ya es el lugar de personalización. Agregar un `<textarea>` o `<input>` de notas allí es natural y no requiere rediseñar el `CartDrawer`. El `CartDrawer` solo muestra las notas si existen (read-only).

### D-4: KDSCard muestra notas por ítem debajo de ingredientes excluidos

`PedidoCocinaItemRead` ya tiene `notas`. La card del KDS itera los ítems y muestra `item.notas` debajo de los ingredientes excluidos, con el mismo estilo visual.

## Risks / Trade-offs

- **Carrito con ítems existentes sin notas**: al agregar el campo, los ítems existentes en localStorage tendrán `personalizacion.notas = undefined`. El código debe tratarlo como `null`/vacío sin romper. → Usar `?? ''` o `|| ''` en comparaciones.
- **`matchItem` y duplicados**: si el usuario agrega un producto sin notas y luego lo agrega con notas, serán dos ítems distintos (comportamiento correcto pero podría confundir). → Es el mismo comportamiento que ingredientes excluidos, aceptable.

## Migration Plan

1. Actualizar `Personalizacion` en `cart.ts` — agregar `notas?: string`
2. Actualizar `matchItem` en `cartStore.ts` — comparar `notas`
3. Actualizar `PersonalizarProductoModal` — agregar textarea de notas
4. Actualizar `CartDrawer` — mostrar notas por ítem si existen
5. Verificar que `notas` viaja correctamente en el payload de checkout
6. Actualizar `KDSCard` — mostrar `item.notas` por ítem

Rollback: revertir los cambios de `cart.ts` y `cartStore.ts` — el campo simplemente no se envía al backend (que lo acepta como nullable).
