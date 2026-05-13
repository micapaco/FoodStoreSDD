# Design: Checkout Validation

## Architectural Approach
Se implementa una validacion sincrona en el frontend al momento de iniciar el checkout. El backend provee un endpoint de pre-validacion que consume los items del carrito y verifica stock, disponibilidad y precios actuales.

## API Contract
### `POST /api/v1/pedidos/validar`
**Request Body:**
```json
{
  "items": [
    {
      "productoId": 1,
      "cantidad": 2,
      "precioEsperado": 1200.0,
      "exclusiones": [3, 4]
    }
  ]
}
```

**Response Body (200 OK):**
```json
{
  "valido": false,
  "errores": [
    {
      "productoId": 1,
      "tipo": "STOCK_INSUFICIENTE",
      "mensaje": "Stock insuficiente. Disponible: 1"
    }
  ],
  "preciosActualizados": [
    {
      "productoId": 2,
      "precioViejo": 1200.0,
      "precioNuevo": 1350.0
    }
  ]
}
```

`valido` es `false` cuando hay errores de stock/disponibilidad o precios actualizados. La creacion atomica del pedido queda fuera de este change y pertenece a `12 - order-creation`.

## Implementation Details

### Backend
1. **Schemas**: `ValidarCarritoRequest` y `ValidarCarritoResponse` heredan de `BaseSchema`, usan aliases camelCase para el contrato JSON y validan cantidad/precio.
2. **Service Layer**: `PedidosService.validar_carrito()`:
   - Consulta el producto vigente por id dentro del UoW abierto por el router.
   - Rechaza productos inexistentes, no disponibles o soft-deleted.
   - Compara stock disponible contra la cantidad del carrito.
   - Compara `precioEsperado` contra `precio_base`.
3. **Router**: registra `POST /api/v1/pedidos/validar` bajo el router v1, protegido con rol `CLIENT`.

### Frontend
1. **API client**: `validarCarritoApi()` consume `/pedidos/validar` a traves del Axios compartido.
2. **Hook**: `useValidarCheckout()` usa `useMutation`.
3. **UI Integration**:
   - `CheckoutPage` construye el request desde el carrito persistido.
   - Muestra errores de stock/disponibilidad y cambios de precio.
   - No crea pedidos ni inicia pagos; solo bloquea el avance si el backend responde `valido=false`.
