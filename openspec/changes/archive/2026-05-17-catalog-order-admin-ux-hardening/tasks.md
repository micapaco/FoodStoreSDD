## 1. Contrato y base de datos

- [x] 1.1 Crear migracion Alembic para quitar la unicidad global de `categoria.nombre`.
- [x] 1.2 Crear indice unico parcial case-insensitive sobre `lower(btrim(nombre)) WHERE deleted_at IS NULL`.
- [x] 1.3 Quitar `unique=True` del modelo SQLModel de `Categoria.nombre`.
- [x] 1.4 Agregar `personalizacion_snapshot JSONB NULL` a `detalle_pedido`.
- [x] 1.5 Verificar downgrade de ambas migraciones sin perdida de tablas ajenas.

## 2. Backend categorias

- [x] 2.1 Ajustar repositorio/service para buscar duplicados de categoria solo entre registros activos.
- [x] 2.2 Normalizar `nombre` con trim antes de crear/actualizar.
- [x] 2.3 Rechazar duplicados activos con `409 Conflict` y mensaje claro.
- [x] 2.4 Permitir crear nueva categoria si solo existe una soft-deleted con el mismo nombre normalizado.
- [x] 2.5 Cubrir con tests: duplicado activo, duplicado soft-deleted permitido, case-insensitive activo rechazado.

## 3. Backend pedidos y exclusiones

- [x] 3.1 Al crear pedido, validar que cada ID de `personalizacion` pertenezca al producto y sea removible.
- [x] 3.2 Persistir `personalizacion_snapshot` con `{ ingredienteId, nombre }` para cada exclusion.
- [x] 3.3 Extender schemas de detalle con `personalizacionDetalle` sin quitar `personalizacion`.
- [x] 3.4 Resolver fallback para pedidos antiguos sin snapshot.
- [x] 3.5 Cubrir detalle cliente/admin y creacion con tests.

## 4. Backend productos imagenes

- [x] 4.1 Agregar endpoint `POST /api/v1/productos/imagenes` protegido por rol `ADMIN`.
- [x] 4.2 Validar `jpg`, `jpeg`, `png`, `webp`, content-type de imagen y tamano maximo definido.
- [x] 4.3 Guardar con nombre UUID bajo static uploads de productos.
- [x] 4.4 Devolver `{ imagen_url }` reutilizable en create/update de producto.
- [x] 4.5 Cubrir exito, tipo invalido, tamano invalido y usuario sin rol.

## 5. Frontend categorias

- [x] 5.1 Mostrar el mensaje real del backend cuando crear/editar categoria devuelve `409`.
- [x] 5.2 Ajustar copy de conflicto: "Ya existe una categoria activa con ese nombre".
- [x] 5.3 Verificar que crear una categoria con nombre de una soft-deleted no tenga tratamiento especial en UI.

## 6. Frontend productos

- [x] 6.1 En formulario admin, permitir elegir entre URL externa o subir archivo.
- [x] 6.2 Al subir archivo, llamar `POST /productos/imagenes` y colocar la URL retornada en `imagen_url`.
- [x] 6.3 Mantener preview, limpiar imagen y validaciones de longitud para URL.
- [x] 6.4 Agregar ayuda contextual: ingredientes con `es_removible=true` aparecen como exclusiones para el cliente.

## 7. Frontend pedidos y configuracion

- [x] 7.1 Mostrar `personalizacionDetalle` por nombre en confirmacion de pedido.
- [x] 7.2 Mostrar exclusiones por nombre en detalle de "Mis pedidos".
- [x] 7.3 Mostrar exclusiones por nombre en detalle operativo admin.
- [x] 7.4 Usar `pedidos_habilitados=false` para mostrar aviso global aunque `mensaje_sistema` este vacio.
- [x] 7.5 Bloquear checkout/confirmacion en frontend cuando pedidos esten deshabilitados, sin bloquear catalogo ni carrito.
- [x] 7.6 Mantener manejo del `503` backend como fallback si la configuracion cambia durante checkout.

## 8. MercadoPago y ajustes UX detectados en prueba

- [x] 8.1 Agregar contrato backend para crear pedido con intento MercadoPago desde checkout.
- [x] 8.2 Mover el formulario MercadoPago al checkout y quitarlo de la confirmacion.
- [x] 8.3 Evitar que pagos rechazados/cancelados dejen pedidos pendientes sin intento trazable.
- [x] 8.4 Mostrar exclusiones por nombre en checkout, sin mostrar ingredientes incluidos.
- [x] 8.5 Mostrar motivo del historial de cancelacion en detalle operativo admin.
- [x] 8.6 Cambiar badge `ADMIN` a violeta en navbar y usuarios.
- [x] 8.7 Cubrir flujo MercadoPago checkout con tests backend.
- [x] 8.8 Renderizar shell cliente completo cuando `ADMIN` usa "Ver como cliente".
- [x] 8.9 Aislar carrito persistido por usuario autenticado.
- [x] 8.10 Permitir que `ADMIN` satisfaga rutas/endpoints de cliente sin mezclar UI admin.

## 9. Verificacion

- [x] 9.1 Ejecutar tests backend relevantes.
- [x] 9.2 Ejecutar build/lint frontend.
- [x] 9.3 Validar OpenSpec del change.
- [x] 9.4 Prueba manual: categoria soft-deleted permite crear nueva activa con mismo nombre.
- [x] 9.5 Prueba manual: pedido con exclusiones muestra nombres en cliente y admin.
- [x] 9.6 Prueba manual: pedidos deshabilitados bloquea checkout con aviso claro.
- [x] 9.7 Prueba manual: MercadoPago desde checkout no deja pedido pendiente sin intento.
- [x] 9.8 Prueba manual: admin en vista cliente ve carrito, checkout y boton Panel admin.
- [x] 9.9 Prueba manual: cambio admin -> cliente no hereda carrito.
