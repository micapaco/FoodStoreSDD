## Context

El modelo `Producto` en backend no tiene campo de imagen. El frontend muestra un placeholder SVG genérico en catálogo, detalle público y detalle admin. El TP requiere visualmente que los productos tengan imágenes. La solución más directa sin file upload es un campo `imagen_url` (URL externa) que el admin carga al crear/editar un producto.

**Estado actual:**
- `Producto` SQLAlchemy model: sin campo imagen
- `ProductoCreate` / `ProductoUpdate` / `ProductoRead` / `ProductoDetail`: sin `imagen_url`
- Frontend types (`ProductoRead`, `ProductoDetail`, `ProductoCreate`, `ProductoUpdate`): sin `imagen_url`
- `ProductoForm.tsx`: sin campo de imagen
- `CatalogoPage.tsx`, `ProductoDetallePage.tsx`, `ProductosDetailPage.tsx`: placeholder SVG fijo

## Goals / Non-Goals

**Goals:**
- Agregar `imagen_url` nullable al modelo de base de datos con migración Alembic limpia
- Exponer el campo en todos los schemas Pydantic relevantes (Create, Update, Read, Detail)
- Agregar campo de URL en el formulario admin con validación de formato y preview en tiempo real
- Mostrar imagen real en catálogo y detalle (público y admin) con fallback al placeholder SVG si la URL falla o es null
- Diseño responsive: la imagen se adapta al contenedor en mobile y desktop

**Non-Goals:**
- File upload / almacenamiento de imágenes en servidor o CDN
- Validación de que la URL apunta a una imagen válida (se delega al comportamiento del `<img>` tag)
- Optimización de imágenes (lazy loading avanzado, srcset, next/image)
- Moderación de contenido de imágenes

## Decisions

### D1: Campo nullable VARCHAR(500) en base de datos
`imagen_url` es `String(500)`, nullable, sin índice. No requiere valor — los productos existentes siguen funcionando. 500 caracteres es suficiente para URLs típicas de imágenes externas.

**Alternativa descartada**: campo NOT NULL con default vacío → generaría ruido en los datos (string vacío ≠ null).

### D2: Validación solo en frontend (no en backend)
El backend acepta cualquier string de hasta 500 chars como `imagen_url`. La validación de que sea una URL válida ocurre en el formulario frontend. El `<img onError>` maneja URLs rotas silenciosamente mostrando el fallback.

**Alternativa descartada**: `HttpUrl` en Pydantic → rechaza URLs con dominios privados/relativos y genera errores confusos al admin.

### D3: Migración addColumn simple (sin backfill)
La columna es nullable → `ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(500)` sin backfill. Rollback: `ALTER TABLE productos DROP COLUMN imagen_url`.

**Alternativa descartada**: valor default vacío → innecesario con nullable.

### D4: Fallback con `onError` en `<img>`
```tsx
<img
  src={producto.imagen_url}
  alt={producto.nombre}
  onError={(e) => { e.currentTarget.style.display = 'none'; placeholder.style.display = 'flex' }}
/>
```
Si la URL no carga, se muestra el placeholder SVG existente. No se usa `useState` para el fallback — el `onError` DOM es suficiente.

**Alternativa descartada**: `useState` para error de imagen → más re-renders innecesarios.

### D5: Preview en tiempo real en el formulario
El campo `imagen_url` en `ProductoForm.tsx` incluye un `<img>` de preview que se actualiza mientras el admin escribe. Se usa `onError` para mostrar un placeholder de preview si la URL no carga.

## Risks / Trade-offs

- **URLs rotas** → Mitigación: fallback SVG vía `onError`; el admin es responsable de la URL
- **Imágenes de origen cruzado** → Sin mitigación: CORS del servidor de imagen es externo. Si falla, muestra fallback.
- **URLs muy largas** → Mitigación: validación de max 500 chars en el form y en Pydantic Field
- **Sin lazy loading** → Aceptable para el TP; las imágenes del catálogo cargan con el grid

## Migration Plan

1. Crear migración Alembic: `alembic revision --autogenerate -m "add_imagen_url_to_productos"`
2. Revisar el archivo generado — verificar que solo agrega la columna, sin otras alteraciones
3. Aplicar: `alembic upgrade head`
4. Rollback: `alembic downgrade -1`

No hay seed data que actualizar — `imagen_url = NULL` por defecto en todos los registros existentes.
