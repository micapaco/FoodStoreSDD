## 1. HTTP Client

- [x] 1.1 Agregar fallback `/api/v1` cuando `VITE_API_BASE_URL` no está definido.
- [x] 1.2 Usar el mismo `API_BASE_URL` para refresh token.
- [x] 1.3 Verificar login vía proxy de Vite (`localhost:5173/api/v1/auth/login`).

## 2. Auth Store And Role Safety

- [x] 2.1 Normalizar usuarios persistidos para que `roles` siempre sea `string[]`.
- [x] 2.2 Agregar helper seguro `getSafeUserRoles`.
- [x] 2.3 Actualizar navegación, headers, guards y páginas de productos para usar roles seguros.

## 3. Post-Login Redirect

- [x] 3.1 Agregar helper `resolvePostLoginPath`.
- [x] 3.2 Evitar redirigir usuarios a rutas no autorizadas por su rol.
- [x] 3.3 Reutilizar `getRoleHome` en `GuestOnlyRoute`.

## 4. Build Fixes

- [x] 4.1 Corregir tipos de formatters en `AdminDashboardPage`.
- [x] 4.2 Eliminar suscripción no usada de checkout.

## 5. Verification

- [x] 5.1 Ejecutar `npm.cmd run build`.
- [x] 5.2 Ejecutar `npm.cmd run lint`.
- [x] 5.3 Verificar backend health y login directos contra `localhost:8000`.
- [x] 5.4 Verificar health, login, registro y `/auth/me` vía proxy de Vite.
