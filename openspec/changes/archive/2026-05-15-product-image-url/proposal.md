## Why

Los productos actualmente no tienen imagen — el catálogo y el detalle muestran un placeholder SVG genérico, lo que reduce el atractivo visual de la tienda. Agregar `imagen_url` permite mostrar imágenes reales sin necesidad de file upload (se usa URL externa), alineado con la complejidad del TP.

## What Changes

- **Backend**: Agregar columna `imagen_url VARCHAR(500) NULLABLE` al modelo `Producto` con migración Alembic correspondiente. Actualizar schemas Pydantic (`ProductoCreate`, `ProductoUpdate`, `ProductoRead`, `ProductoPublicRead`) para incluir el campo.
- **Frontend (admin)**: Agregar campo `imagen_url` al formulario de creación/edición de productos (`ProductoForm.tsx`) con validación de formato URL y preview de imagen en tiempo real.
- **Frontend (catálogo)**: Mostrar imagen real en las product cards de `CatalogoPage.tsx` cuando `imagen_url` está presente; mantener el placeholder SVG como fallback.
- **Frontend (detalle público)**: Mostrar imagen real en `ProductoDetallePage.tsx` cuando `imagen_url` está presente; mantener el placeholder como fallback.
- **Frontend (detalle admin)**: Mostrar imagen real en `ProductosDetailPage.tsx` cuando `imagen_url` está presente.

## Capabilities

### New Capabilities

_(ninguna — esta funcionalidad es una extensión de las capacidades existentes)_

### Modified Capabilities

- `productos-api`: Se agrega el campo `imagen_url` (nullable, string) a los schemas de Create, Update y Read. El endpoint no cambia — solo el payload.
- `productos-frontend`: El formulario de productos incorpora el campo `imagen_url`; las vistas de catálogo, detalle público y detalle admin renderizan la imagen cuando está disponible.

## Impact

- **Backend**: `backend/app/modules/productos/models.py`, `backend/app/modules/productos/schemas.py`, nueva migración Alembic en `backend/alembic/versions/`
- **Frontend**: `frontend/src/features/productos/components/ProductoForm.tsx`, `frontend/src/pages/productos/CatalogoPage.tsx`, `frontend/src/pages/productos/ProductoDetallePage.tsx`, `frontend/src/pages/productos/ProductosDetailPage.tsx`
- **Sin breaking changes**: `imagen_url` es nullable — los productos existentes sin imagen siguen funcionando con el placeholder.
- **Sin cambios de endpoints**: mismas rutas, solo nuevos campos en el payload/response.
