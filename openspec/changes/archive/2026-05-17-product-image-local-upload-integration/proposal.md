## Why

El change `catalog-order-admin-ux-hardening` dejo documentado "upload local de imagen de producto", pero la experiencia real en la web no lo cumple de punta a punta: al crear o editar un producto desde las rutas activas del panel (`/admin/productos/nuevo` y `/admin/productos/:id/editar`) el formulario usado es `ProductoForm.tsx`, y ese formulario solo muestra el campo `Imagen (URL)`.

La investigacion encontro implementacion parcial y assets locales nuevos:

- Backend tiene `POST /api/v1/productos/imagenes`, `UploadFile`, guardado local y static files.
- Frontend tiene `uploadProductoImagen()` y `useUploadProductoImagen()`.
- `ProductsAdminPage.tsx` contiene un modal inline con input file, pero esa pagina no esta conectada al router actual de productos.
- `ProductoForm.tsx`, que si se usa en crear/editar producto, no integra upload local.
- El usuario agrego imagenes seed en `backend/app/modules/productos/imagenes/`: `pizza.jpg`, `hamburguesa.jpg`, `cocacola.jpg`, `agua.jpg`, `papas.jpg`, `flan.jpg`.
- Los tests existentes cubren `ProductoService.guardar_imagen_producto`, pero no el contrato HTTP ni la UI real usada por admin.

Por eso este change corrige la brecha entre contrato, codigo parcial y experiencia visible, y revisa que no queden ramas huerfanas/confusas.

## What Changes

- Integrar carga local de imagen en `ProductoForm.tsx` y remover la carga manual por URL desde la UI admin.
- Reutilizar `useUploadProductoImagen()` y `uploadProductoImagen()` existentes, sin inventar un endpoint nuevo.
- Mostrar estado de subida, errores claros y preview de la imagen retornada.
- Al subir archivo, colocar la `imagen_url` retornada en el mismo campo persistido que usan create/update.
- Ampliar formatos de upload a imagenes web comunes (`jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`), manteniendo validacion por content-type y tamano.
- Asignar imagenes locales a los productos de seed: pizza, hamburguesa, Coca-Cola, agua, papas y flan.
- Si una imagen seed no existe o no se puede publicar, dejar `imagen_url=NULL` para que el producto siga funcionando con placeholder.
- Endurecer el endpoint `POST /api/v1/productos/imagenes` para que sea alcanzable como ruta estatica y quede cubierto por tests HTTP.
- Auditar y resolver duplicacion/huerfandad entre `ProductsAdminPage.tsx` y las paginas reales `ProductosPage`, `ProductosCreatePage`, `ProductosEditPage`.
- Actualizar tests y validaciones para cubrir service, router y flujo frontend real.

## Scope

Cross-domain acotado:

- **Backend**: router de productos, tests HTTP de upload y verificacion de static files.
- **Seed**: asignacion idempotente de imagenes locales a productos base.
- **Frontend**: `ProductoForm.tsx`, paginas create/edit si necesitan pasar props de upload, hook de mutation, API client y fallback visual.
- **OpenSpec**: refinar contratos vigentes de `productos-api` y `productos-frontend`.
- **Limpieza**: identificar codigo duplicado/huerfano relacionado con formularios de producto y dejar una sola ruta clara de administracion.

## Non-Goals

- Implementar almacenamiento cloud/CDN.
- Cambiar la columna persistida `imagen_url`.
- Convertir create/update de producto a multipart.
- Borrar automaticamente archivos huerfanos ya subidos.
- Redisenar por completo la pantalla de productos.
- Cambiar reglas de stock, categorias o ingredientes fuera de la carga de imagen.
- Aceptar SVG sin sanitizacion. Por seguridad, queda fuera del set inicial de formatos aceptados.

## Impact

- **API**: contrato existente, sin cambio breaking.
- **DB**: sin migraciones.
- **Seed**: productos base pueden tener `imagen_url` local si el asset existe; si falta, quedan sin imagen sin romper la carga.
- **Frontend**: el formulario real de crear/editar producto pasa de "solo URL" a "solo archivo local".
- **Tests**: se agrega cobertura HTTP del endpoint y validacion del flujo frontend de upload.
- **Mantenibilidad**: se elimina o documenta codigo no usado para evitar futuras confusiones.
