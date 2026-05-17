## 1. Auditoria previa

- [x] 1.1 Confirmar rutas activas de productos en `frontend/src/app/router.tsx`.
- [x] 1.2 Confirmar que create/edit usan `ProductoForm.tsx`.
- [x] 1.3 Confirmar si `ProductsAdminPage.tsx` tiene imports/rutas reales o es codigo huerfano.
- [x] 1.4 Listar codigo existente de upload backend/frontend para reutilizarlo y no duplicarlo.
- [x] 1.5 Confirmar existencia de assets seed en `backend/app/modules/productos/imagenes/`.

## 2. Backend upload

- [x] 2.1 Mover/asegurar `POST /api/v1/productos/imagenes` antes de rutas dinamicas `/{producto_id}`.
- [x] 2.2 Ampliar validaciones a `jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`, content-type y tamano maximo.
- [x] 2.3 Mantener respuesta `{ imagen_url }` y static mount `/static/uploads/productos/...`.
- [x] 2.4 Agregar tests HTTP del endpoint: sin auth no colisiona con `producto_id`, admin exitoso, tipo invalido.
- [x] 2.5 Mantener tests de service existentes.

## 3. Seed de productos con imagenes locales

- [x] 3.1 Definir mapping de productos seed a assets: pizza, hamburguesa, cocacola, agua, papas, flan.
- [x] 3.2 Publicar/copiar assets existentes desde `backend/app/modules/productos/imagenes/` hacia el directorio servido por static.
- [x] 3.3 Persistir `imagen_url` para cada producto seed cuando su asset exista.
- [x] 3.4 Si falta un asset, insertar/actualizar el producto sin romper seed y dejando `imagen_url` sin valor.
- [x] 3.5 Mantener idempotencia: no pisar imagenes manuales ya cargadas por admin.
- [x] 3.6 Cubrir fallback de asset faltante con test o verificacion automatizada.

## 4. Frontend formulario real

- [x] 4.1 Integrar `useUploadProductoImagen()` en `ProductoForm.tsx`.
- [x] 4.2 Reemplazar el campo libre `Imagen (URL)` por un control de archivo local.
- [x] 4.3 Usar `accept` para formatos soportados: `image/jpeg,image/png,image/webp,image/gif,image/avif`.
- [x] 4.4 Al subir archivo exitosamente, setear `imagen_url` con la URL retornada por backend.
- [x] 4.5 Mostrar estado de subida y errores via toast o mensaje local consistente con el proyecto.
- [x] 4.6 Mantener preview para imagen precargada o subida local.
- [x] 4.7 Evitar submit mientras upload o guardado estan pendientes.
- [x] 4.8 Mantener fallback visual si la imagen no carga.

## 5. Limpieza de codigo

- [x] 5.1 Si `ProductsAdminPage.tsx` no se usa, eliminarlo o migrar lo util antes de eliminar.
- [x] 5.2 Verificar que no queden imports rotos ni componentes duplicados de formulario.
- [x] 5.3 Confirmar que no se agregan endpoints, hooks o tipos redundantes.

## 6. Validacion

- [x] 6.1 Ejecutar tests backend relevantes de productos/upload/seed.
- [x] 6.2 Ejecutar lint/build frontend.
- [x] 6.3 Validar OpenSpec del change en strict.
- [x] 6.4 Prueba manual: crear producto subiendo imagen local.
- [x] 6.5 Prueba manual: editar producto reemplazando imagen local.
- [x] 6.6 Prueba manual: seed carga imagenes de pizza, hamburguesa, Coca-Cola, agua, papas y flan.
- [x] 6.7 Prueba manual: si falta una imagen seed, el producto aparece con placeholder y no rompe catalogo/detalle.
