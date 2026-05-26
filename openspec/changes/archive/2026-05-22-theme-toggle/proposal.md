## Why

El dashboard carga actualmente en modo oscuro por defecto, lo que dificulta su uso en entornos con buena iluminación (restaurantes, cocinas, mostradores). Se necesita un tema claro como opción predeterminada, con la posibilidad de volver al oscuro según preferencia del usuario.

## What Changes

- El tema por defecto del frontend pasa de oscuro a claro (fondo blanco, textos oscuros)
- Se agrega un botón de toggle en el header/navbar para cambiar entre claro y oscuro
- La preferencia se persiste en `localStorage` para que sobreviva recarga y sesiones
- El modo oscuro (diseño actual) se mantiene sin cambios — sigue siendo una opción válida
- No se modifica ninguna lógica de negocio, stores, rutas ni contratos API

## Capabilities

### New Capabilities
- `theme-toggle-ui`: Toggle visual de tema claro/oscuro en la navbar, con persistencia en `localStorage` y aplicación del atributo `data-theme` (o clase `dark`) en el `<html>`

### Modified Capabilities
- `layout`: El layout base pasa a renderizar en tema claro por defecto; el modo oscuro se activa solo si el usuario lo eligió o si su sistema lo prefiere

## Impact

- `frontend/src/` — cambios en tokens de color Tailwind, layout base y navbar
- `tailwind.config.ts` — activar modo `class` para dark mode si no está activado
- Sin impacto en backend, API, DB ni otros dominios
