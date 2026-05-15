## 1. Backend — Modelo y migración

- [x] 1.1 Agregar columna `imagen_url = Column(String(500), nullable=True)` al modelo `Producto` en `backend/app/db/models/catalogo.py`
- [x] 1.2 Generar migración Alembic: `alembic revision --autogenerate -m "add_imagen_url_to_productos"` y revisar el archivo generado
- [x] 1.3 Aplicar migración: `alembic upgrade head`

## 2. Backend — Schemas Pydantic

- [x] 2.1 Agregar `imagen_url: Optional[str] = Field(default=None, max_length=500)` a `ProductoCreate`
- [x] 2.2 Agregar `imagen_url: Optional[str] = Field(default=None, max_length=500)` a `ProductoUpdate`
- [x] 2.3 Agregar `imagen_url: Optional[str] = None` a `ProductoRead`
- [x] 2.4 Verificar que `ProductoDetail` hereda `imagen_url` de `ProductoRead` (no requiere cambio adicional)
- [x] 2.5 Buscar y actualizar cualquier schema de catálogo público que serialice productos (ej: schemas usados en endpoints `/api/v1/catalogo/productos`) para que incluyan `imagen_url`

## 3. Frontend — Types TypeScript

- [x] 3.1 Agregar `imagen_url?: string | null` a la interfaz `ProductoRead` en `frontend/src/entities/productos/types.ts`
- [x] 3.2 Agregar `imagen_url?: string | null` a `ProductoCreate`
- [x] 3.3 Agregar `imagen_url?: string | null` a `ProductoUpdate`
- [x] 3.4 Verificar que `ProductoDetail` hereda el campo (extiende `ProductoRead`)

## 4. Frontend — Formulario admin (ProductoForm)

- [x] 4.1 Agregar campo `imagen_url` al `defaultValues` de `useForm` en `ProductoForm.tsx`
- [x] 4.2 Agregar `form.Field name="imagen_url"` con label "Imagen (URL)", input text, placeholder `https://...`, validación `max_length: 500`
- [x] 4.3 Agregar sección de preview en tiempo real: `<img src={field.state.value} onError={...} />` que muestra la imagen o un placeholder si la URL no carga
- [x] 4.4 Asegurar que el campo es responsive (`w-full`) y el preview tiene `aspect-video object-cover rounded-lg`
- [x] 4.5 Verificar que el payload enviado al backend incluye `imagen_url` (o null si está vacío)

## 5. Frontend — Catálogo público (CatalogoPage)

- [x] 5.1 En `ProductCard`, reemplazar el contenedor del placeholder SVG para mostrar `<img>` si `producto.imagen_url` está presente
- [x] 5.2 Implementar fallback: si la imagen falla (`onError`), ocultar `<img>` y mostrar el placeholder SVG
- [x] 5.3 Aplicar clases `w-full h-full object-cover` a la imagen para que ocupe el `aspect-square` del contenedor

## 6. Frontend — Detalle público (ProductoDetallePage)

- [x] 6.1 Reemplazar el contenedor del placeholder SVG izquierdo por lógica condicional: si `producto.imagen_url` existe, mostrar `<img className="w-full h-full object-cover rounded-lg" />`
- [x] 6.2 Mantener el placeholder SVG como fallback (onError + cuando imagen_url es null)

## 7. Frontend — Detalle admin (ProductosDetailPage)

- [x] 7.1 Agregar sección de imagen en el panel de detalle: si `producto.imagen_url`, mostrar `<img>` con `max-h-48 object-contain rounded-lg border border-line-subtle`; si no, mostrar texto "Sin imagen configurada" en `text-ink-muted/60`

## 8. Verificación final

- [x] 8.1 Crear un producto con imagen desde el formulario admin y verificar que aparece en el catálogo
- [x] 8.2 Verificar fallback: editar producto poniendo una URL rota — el catálogo debe mostrar el placeholder sin error visual
- [x] 8.3 Verificar que productos sin imagen muestran el placeholder en catálogo y detalle
- [x] 8.4 Verificar responsive: en mobile la imagen ocupa el ancho completo del contenedor
