## Context

El sistema usa soft delete en categorias y productos. En categorias, la regla actual combina una validacion de servicio por `nombre` con una restriccion unica global en base de datos. Eso contradice la regla definida para este change: una categoria soft-deleted es historial, no debe rehabilitarse y no debe bloquear crear una nueva categoria activa con el mismo nombre.

Los pedidos ya guardan `DetallePedido.personalizacion` como lista de IDs de ingredientes removidos. Esa estructura sirve para validacion y trazabilidad tecnica, pero no sirve como presentacion para cliente/operador. Como los pedidos historicos ya snapshottean producto, precio y direccion, las exclusiones tambien deben tener un snapshot legible.

## Goals / Non-Goals

**Goals:**
- Categoria soft-deleted no bloquea nueva categoria activa con igual nombre normalizado.
- Categoria activa mantiene unicidad por nombre normalizado.
- No existe restore implicito de categorias.
- Detalles de pedido muestran exclusiones por nombre en cliente y admin.
- Imagen de producto se puede cargar desde archivo local del admin o mantener como URL externa.
- Desactivar pedidos deja navegar/catalogar/carrito, pero bloquea checkout con mensaje claro.
- MercadoPago se paga desde checkout antes de mostrar la confirmacion, sin dejar pedidos pendientes sin intento de pago.
- El rol `ADMIN` se distingue visualmente con color violeta en navbar y usuarios.
- La vista cliente usada por `ADMIN` debe renderizar shell, carrito y navegacion de cliente sin mezclar sidebar/admin.

**Non-Goals:**
- Papelera o pantalla de categorias eliminadas.
- Reasignar productos desde categoria eliminada hacia la nueva categoria.
- CDN/cloud storage.
- Modo mantenimiento total del sitio.
- Mostrar ingredientes incluidos en checkout.

## Decisions

### D1 - Unicidad parcial de categoria activa

La base de datos debe ser la fuente final de unicidad. Se elimina la restriccion unica global de `categoria.nombre` y se crea un indice unico parcial:

```sql
CREATE UNIQUE INDEX ux_categoria_nombre_activa_ci
ON categoria (lower(btrim(nombre)))
WHERE deleted_at IS NULL;
```

El service tambien normaliza con trim y verifica solo registros activos para devolver errores de dominio antes de llegar al constraint.

### D2 - Soft delete no es restore

Si existe `categoria(nombre='Entradas', deleted_at IS NOT NULL)` y el admin crea `Entradas`, se inserta una fila nueva con `id` nuevo. No se actualiza la categoria vieja ni se mueve su `deleted_at`.

### D3 - Snapshot de exclusiones

Se conserva `personalizacion: list[int]` por compatibilidad. Se agrega un snapshot JSONB nullable, por ejemplo:

```json
[
  { "ingredienteId": 2, "nombre": "Queso" },
  { "ingredienteId": 3, "nombre": "Cebolla" }
]
```

Las respuestas de detalle exponen ademas `personalizacionDetalle`. Para pedidos existentes sin snapshot, el service intenta resolver nombres actuales por ID; si no puede, devuelve `Ingrediente #<id>` para evitar una UI muda.

### D4 - Upload de imagen desacoplado de crear producto

Se agrega `POST /api/v1/productos/imagenes` con `multipart/form-data` y rol `ADMIN`. El endpoint valida extension/tipo/tamano, guarda el archivo en almacenamiento local servido como static y devuelve `{ imagen_url }`.

El formulario admin puede subir primero una imagen y luego enviar la URL resultante en el contrato existente de create/update. Esto evita convertir el CRUD de productos a multipart y mantiene el cambio acotado.

### D5 - Pedidos deshabilitados no bloquea catalogo

`pedidos_habilitados=false` significa "no aceptar pedidos nuevos", no "sitio cerrado". El frontend debe permitir navegar catalogo y editar carrito, pero debe mostrar aviso global y bloquear checkout/confirmacion con un mensaje claro. El backend conserva el `503` como defensa final.

### D6 - MercadoPago se resuelve en checkout

El formulario de MercadoPago no debe vivir en la pantalla de confirmacion porque esa pantalla permite navegar fuera y deja pedidos `PENDIENTE` sin intento real de pago si el cliente abandona el formulario.

Para `EFECTIVO` y `TRANSFERENCIA`, checkout sigue creando el pedido directamente. Para `MERCADOPAGO`, checkout primero valida carrito/direccion y luego muestra el formulario de tarjeta en la misma vista. Al enviar el formulario se usa un endpoint atomico de caso de uso que recibe los datos del pedido y del pago, crea el pedido y registra el intento.

Si MercadoPago aprueba, el pedido pasa a `CONFIRMADO`. Si devuelve `pending` o `in_process`, el pedido puede quedar `PENDIENTE` porque ya existe un intento de pago trazable. Si devuelve `rejected` o `cancelled`, el pedido se cancela automaticamente con motivo tecnico y el frontend conserva el carrito para reintentar.

### D7 - Checkout solo muestra exclusiones

Aunque el detalle de producto muestra ingredientes incluidos, checkout solo debe mostrar exclusiones seleccionadas, coherente con carrito y detalles de pedido. Los ingredientes incluidos se consideran sabidos por el cliente al agregar el producto.

### D8 - Vista cliente de ADMIN por ruta

El boton "Ver como cliente" lleva al admin a rutas cliente (`/productos`, `/carrito`, `/checkout`, `/pedidos`, `/perfil`, `/direcciones`). En esas rutas, el layout debe renderizar la experiencia cliente completa: navbar cliente, acceso al carrito y boton de regreso a `Panel admin`. En rutas `/admin...`, el mismo usuario vuelve al shell administrativo.

`ADMIN` actua como superrol para rutas y endpoints de cliente, porque el proyecto lo trata como rol abarcador. Esto evita que la vista cliente quede visualmente disponible pero falle al usar checkout o direcciones.

### D9 - Carrito aislado por usuario

El carrito persistido en browser debe estar asociado al `usuario.id`. Al iniciar sesion con otro usuario, el store cambia de owner y limpia los items locales para evitar que un cliente vea productos agregados previamente por admin u otro cliente en el mismo navegador.

## Migration Plan

1. Crear migracion para quitar unique global de `categoria.nombre`.
2. Crear indice unico parcial `ux_categoria_nombre_activa_ci`.
3. Agregar columna nullable `personalizacion_snapshot JSONB` a `detalle_pedido`.
4. No backfill obligatorio: pedidos antiguos se resuelven por fallback en lectura.
5. Servir directorio static de uploads si aun no esta montado.

## Risks / Trade-offs

- **Duplicados historicos**: se permiten varias filas con mismo nombre si solo una esta activa. Es intencional.
- **Nombres antiguos de ingredientes**: sin snapshot en pedidos ya creados, el fallback puede usar el nombre actual. Es aceptable para historico previo al change.
- **Uploads abandonados**: si un admin sube imagen y no guarda el producto, queda archivo huerfano. Se acepta para esta etapa; limpieza programada queda fuera de scope.
- **URLs internas**: `imagen_url` puede ser externa o interna. El frontend debe tratar ambas como URLs de imagen.
