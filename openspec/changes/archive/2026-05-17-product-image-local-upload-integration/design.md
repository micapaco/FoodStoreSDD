## Context

El panel de productos tiene dos estructuras parecidas:

1. Rutas reales del router:
   - `/admin/productos` -> `ProductosPage`
   - `/admin/productos/nuevo` -> `ProductosCreatePage`
   - `/admin/productos/:id/editar` -> `ProductosEditPage`
   - create/edit renderizan `features/productos/components/ProductoForm.tsx`

2. Pagina paralela:
   - `pages/admin/ProductsAdminPage.tsx`
   - contiene un formulario inline con `type="file"` y `useUploadProductoImagen()`
   - no aparece conectada en `app/router.tsx`

La experiencia que ve el usuario viene del primer camino. Por eso, aunque existe codigo parcial de upload, la web visible sigue mostrando solo `Imagen (URL)`.

Ademas, el usuario agrego assets iniciales en `backend/app/modules/productos/imagenes/`:

- `pizza.jpg`
- `hamburguesa.jpg`
- `cocacola.jpg`
- `agua.jpg`
- `papas.jpg`
- `flan.jpg`

La app sirve archivos estaticos desde `backend/app/static`, por lo que la seed no debe apuntar directamente a la carpeta del modulo si esa carpeta no esta montada como static.

## Goals / Non-Goals

**Goals:**
- Integrar upload en `ProductoForm.tsx`, que es el formulario compartido por crear y editar.
- Remover la opcion de ingresar URL externa desde la UI admin.
- Usar la mutation existente `useUploadProductoImagen()` con estados `isPending`, error y success.
- Guardar el resultado en `imagen_url` para que create/update sigan usando JSON normal.
- Aceptar formatos web comunes: `jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`.
- Asignar imagenes de seed a los seis productos base cuando existan.
- No romper seed ni catalogo si falta alguna imagen local.
- Garantizar que `/api/v1/productos/imagenes` no colisiona con `/{producto_id}` y responde segun auth/validacion de archivo.
- Resolver duplicacion/huerfandad relacionada con `ProductsAdminPage.tsx`.

**Non-Goals:**
- Storage cloud.
- Limpieza periodica de archivos no asociados a producto.
- Nuevo modelo de imagenes.
- Nuevo endpoint de create/update multipart.

## Decisions

### D1 - `imagen_url` sigue siendo el contrato persistido

El upload local es un paso previo: sube el archivo y devuelve `{ imagen_url }`. Luego crear/editar producto envia esa URL en el payload JSON existente. Esto evita tocar la persistencia.

Aunque la base sigue guardando `imagen_url` por compatibilidad historica, la UI admin ya no ofrece un campo libre para pegar URLs externas. El origen normal de nuevas imagenes pasa a ser el upload local.

### D2 - El formulario compartido es la fuente UI

La integracion vive en `ProductoForm.tsx` porque ese componente es usado por `ProductosCreatePage` y `ProductosEditPage`. Agregar upload solo en una pagina paralela no resuelve la experiencia real.

### D3 - Estado de upload separado del guardado

`isPending` de create/update y `isPending` de upload deben combinarse para deshabilitar acciones peligrosas mientras se sube o se guarda. El copy debe diferenciar "Subiendo..." de "Guardando..." cuando corresponda.

### D4 - Preview robusta

La preview debe usar `imagen_url` retornada por upload o precargada desde seed/edicion. Si falla la carga de la imagen, se muestra el placeholder existente sin romper el formulario ni el catalogo.

### D5 - Endpoint estatico antes de dinamico

El router de productos debe declarar `/imagenes` antes de `/{producto_id}`. La cobertura HTTP debe confirmar que `POST /api/v1/productos/imagenes` llega al endpoint de upload y no se interpreta como `producto_id`.

### D6 - Formatos permitidos

Se aceptan formatos web comunes por content-type y extension: JPEG (`jpg`/`jpeg`), PNG, WebP, GIF y AVIF. SVG queda fuera hasta tener sanitizacion explicita, porque puede contener contenido activo.

### D7 - Imagenes de seed

La seed define un mapping por nombre de producto:

| Producto | Asset esperado |
|---|---|
| `Pizza Mozzarella` | `pizza.*` |
| `Hamburguesa Clasica` | `hamburguesa.*` |
| `Coca-Cola 500ml` | `cocacola.*` |
| `Agua Mineral 500ml` | `agua.*` |
| `Papas Fritas` | `papas.*` |
| `Flan con Crema` | `flan.*` |

Durante seed, si el asset existe en `backend/app/modules/productos/imagenes/`, se publica bajo el directorio servido por static, preferentemente `backend/app/static/uploads/productos/`, y se persiste una `imagen_url` consumible por el frontend. Si el asset no existe, el producto se inserta igual con `imagen_url=NULL`.

La seed debe ser idempotente: si el producto ya existe, puede actualizar `imagen_url` solo cuando esta vacia o cuando apunta a un asset seed esperado, sin pisar una imagen cargada manualmente por el admin.

### D8 - Limpieza de duplicacion

Si `ProductsAdminPage.tsx` no esta conectado al router, se debe decidir una de estas dos opciones durante apply:

- eliminarlo si no tiene uso real;
- o migrar cualquier comportamiento valioso al flujo real y dejarlo sin duplicacion.

La decision se toma revisando imports/rutas antes de borrar. No se elimina codigo usado.

## Risks / Trade-offs

- **Archivos huerfanos**: si el admin sube una imagen y cancela el formulario, queda un archivo sin producto asociado. Se acepta por ahora; limpieza programada queda fuera de scope.
- **Tests con archivos**: las pruebas deben usar directorio temporal o monkeypatch de `PRODUCT_IMAGE_DIR`.
- **UI de archivo**: el input file no puede prellenarse por seguridad del navegador; al editar, se muestra preview por `imagen_url` y se permite reemplazar subiendo otro archivo.
- **Assets seed faltantes**: la seed no debe fallar por archivos faltantes; el catalogo conserva placeholder.
