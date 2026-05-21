## Why

El catalogo y el flujo de pedidos ya estan implementados, pero hay fricciones que generan errores o informacion poco clara para usuarios reales:

- Crear una categoria con el mismo nombre de una categoria soft-deleted devuelve `409 Conflict`, aunque esa categoria eliminada no debe rehabilitarse ni bloquear una nueva categoria activa.
- Las exclusiones de ingredientes se guardan como IDs y luego se muestran como `2, 3` o directamente no aparecen en vistas de pedido, lo que confunde a clientes y operadores.
- La personalizacion de productos funciona por datos (`es_removible=true`), pero la UI admin no comunica que esos toggles controlan el modal de exclusion del cliente.
- La imagen de producto solo acepta URL, lo que obliga al admin a usar un hosting externo si tiene una foto local.
- `pedidos_habilitados=false` bloquea el `POST /pedidos` en backend, pero el frontend no anticipa el bloqueo en carrito/checkout.

## What Changes

- Ajustar la unicidad de categorias para que aplique solo a categorias activas (`deleted_at IS NULL`) y de forma case-insensitive.
- Permitir crear una nueva categoria con el mismo nombre de una categoria soft-deleted, sin restaurar ni reutilizar el registro anterior.
- Mostrar mensajes de conflicto de categorias claros en el panel admin.
- Agregar snapshot legible de ingredientes excluidos en los detalles de pedido y exponerlo en respuestas de detalle cliente/admin.
- Renderizar exclusiones por nombre en confirmacion, detalle de "Mis pedidos" y detalle admin.
- Agregar endpoint de upload de imagen de producto que devuelve una URL interna reutilizable en `imagen_url`.
- Permitir en el formulario admin usar URL o subir archivo, manteniendo `imagen_url` como campo persistido.
- Usar `pedidos_habilitados` en frontend para mostrar aviso global y bloquear checkout/confirmacion de pedido antes de llamar al backend.
- Agregar ayuda contextual en producto admin para explicar que solo ingredientes marcados como removibles aparecen como exclusiones al cliente.

## Scope

Cross-domain:

- **Backend**: categorias, productos, pedidos, configuracion publica y migraciones Alembic.
- **Frontend**: admin categorias, admin productos, catalogo/detalle/checkout/carrito, pedidos cliente y pedidos admin.
- **OpenSpec**: modificar contratos existentes, sin crear un modulo de negocio nuevo.

## Non-Goals

- Rehabilitar categorias soft-deleted.
- Borrar fisicamente categorias historicas.
- Bloquear la navegacion completa del sitio cuando `pedidos_habilitados=false`.
- Implementar almacenamiento cloud de imagenes.
- Cambiar la forma en que el carrito envia exclusiones: sigue enviando IDs validados por backend.

## Impact

- **DB**: migracion para reemplazar la unicidad global de `categoria.nombre` por indice unico parcial; columna/snapshot JSONB para exclusiones legibles de `detalle_pedido`.
- **API**: nuevo contrato para upload de imagen y extension no breaking de respuestas de detalle de pedido.
- **Frontend**: nuevas ramas de UI para errores, exclusion legible, subida de imagen y estado de pedidos deshabilitados.
- **Tests**: backend para unicidad parcial, snapshots de exclusiones, upload y bloqueo de pedidos; frontend para mensajes y renderizado.
