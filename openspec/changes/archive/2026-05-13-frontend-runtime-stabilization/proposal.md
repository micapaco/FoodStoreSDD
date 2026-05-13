## Why

Al levantar el proyecto desde cero aparecieron fallos de runtime en el frontend que impedían validar el sistema completo:

- Sin `frontend/.env`, Axios quedaba con `baseURL=undefined` y enviaba login/register a `http://localhost:5173/auth/*` en vez de `/api/v1/auth/*`.
- Estado persistido viejo de `authStore` podía tener `user.roles` ausente y romper la navegación con `Cannot read properties of undefined (reading 'includes')`.
- El login podía devolver a un usuario `CLIENT` hacia una ruta admin preservada en `?from=`, terminando en `/403` aunque la autenticación fuera correcta.
- El build desde cero exponía errores TypeScript en el dashboard admin y checkout.

## What Changes

- Axios usa `VITE_API_BASE_URL` cuando existe y fallback `/api/v1` cuando no existe, aprovechando el proxy de Vite.
- `authStore` normaliza usuarios persistidos y expone lectura segura de roles.
- Navegación/guards/componentes consumen roles de forma defensiva.
- Login resuelve la ruta post-login según el rol y no redirige a rutas no autorizadas.
- Se corrigen errores de TypeScript en dashboard admin y checkout.

## Impact

- **Frontend only**: no cambia endpoints backend ni reglas de dominio.
- **Setup local más robusto**: la app funciona aunque el usuario olvide copiar `frontend/.env.example`.
- **Auth UX más segura**: usuarios autenticados aterrizan en rutas permitidas para su rol.
- **Calidad**: `npm run build` y `npm run lint` quedan verdes.
