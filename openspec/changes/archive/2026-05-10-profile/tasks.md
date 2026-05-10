## 1. Configuración y schemas

- [x] 1.1 Agregar campos `telefono` al modelo `Usuario` en `app/modules/usuarios/model.py` (verificar si ya existe en schema)
- [x] 1.2 Crear schemas `UpdateProfileRequest` y `ChangePasswordRequest` en `app/modules/auth/schemas.py`
- [x] 1.3 Registrar rate limit para `PUT /auth/change-password` (10/minuto) en el router

## 2. Backend — Servicio y endpoints de perfil

- [x] 2.1 Agregar método `update_profile(usuario_id, data, uow)` en `AuthService`: validar email único si cambió, actualizar campos permitidos (nombre, apellido, telefono, email)
- [x] 2.2 Agregar método `change_password(usuario_id, current_password, new_password, uow)` en `AuthService`: verificar contraseña actual, validar política (mín 8 chars, no igual a actual, no contiene email), hashear con bcrypt y actualizar
- [x] 2.3 Agregar endpoint `PUT /auth/me` en `app/modules/auth/router.py` con `Depends(get_current_user)`, llama `AuthService.update_profile`, retorna `UserResponse`
- [x] 2.4 Agregar endpoint `PUT /auth/change-password` en `app/modules/auth/router.py` con `Depends(get_current_user)` y `@limiter.limit("10/minute")`, llama `AuthService.change_password`, retorna `200 {"message": "Contraseña actualizada correctamente"}`

## 3. Backend — Validaciones

- [x] 3.1 Validar en `update_profile` que `email` no esté duplicado (si cambió) → 409 Conflict con mensaje genérico
- [x] 3.2 Validar en `change_password`: current_password incorrecta → 403 Forbidden con mensaje "Contraseña actual incorrecta"
- [x] 3.3 Validar en `change_password`: new_password == current_password → 422 con detalle específico
- [x] 3.4 Validar en `change_password`: new_password contiene email del usuario → 422 con detalle específico
- [x] 3.5 Validar en `change_password`: confirm_password != new_password → 422 con detalle específico
- [x] 3.6 Verificar en Swagger que ambos endpoints aparecen con schemas correctos y documentación

## 4. Backend — Smoke tests manuales

- [x] 4.1 Login como CLIENT → `PUT /auth/me` con datos válidos → 200 + datos actualizados
- [x] 4.2 `PUT /auth/me` con email duplicado → 409
- [x] 4.3 `PUT /auth/me` con nombre vacío → 422
- [x] 4.4 `PUT /auth/me` sin token → 401
- [x] 4.5 `PUT /auth/change-password` con datos válidos → 200 + login con nueva contraseña funciona
- [x] 4.6 `PUT /auth/change-password` con current_password incorrecta → 403
- [x] 4.7 `PUT /auth/change-password` con new_password < 8 chars → 422
- [x] 4.8 `PUT /auth/change-password` con new_password == current_password → 422
- [x] 4.9 `PUT /auth/change-password` con new_password conteniendo email → 422
- [x] 4.10 `PUT /auth/change-password` 11 intentos → 429

## 5. Frontend — Hook useProfile y API calls

- [x] 5.1 Crear `shared/api/profile.ts` con funciones: `updateProfileApi(data)`, `changePasswordApi(data)` usando axiosInstance
- [x] 5.2 Crear `shared/hooks/useProfile.ts` con: `useProfile()` (useQuery con key ['profile', 'me']), `useUpdateProfile()` (useMutation + invalidateQueries), `useChangePassword()` (useMutation sin invalidate)
- [x] 5.3 Conectar `useProfile` a la caché de TanStack Query con staleTime 5 minutos

## 6. Frontend — ProfilePage

- [x] 6.1 Reemplazar `pages/ProfilePage.tsx` (placeholder) con implementación real: vista de datos personales con info del `useProfile` hook
- [x] 6.2 Agregar estado de edición inline con toggle "Editar" / "Cancelar"
- [x] 6.3 Implementar formulario de edición con TanStack Form: campos nombre, apellido, telefono, email con validación (required, email format)
- [x] 6.4 Manejar submit del formulario: llamar `useUpdateProfile`, mostrar toast de éxito/error
- [x] 6.5 Mostrar skeleton loading mientras se cargan datos
- [x] 6.6 Mostrar estado de error con botón "Reintentar" si falla la carga del perfil

## 7. Frontend — Cambio de contraseña

- [x] 7.1 Agregar sección "Cambiar contraseña" debajo de los datos personales en ProfilePage
- [x] 7.2 Implementar formulario con TanStack Form: campos current_password, new_password, confirm_password
- [x] 7.3 Validación client-side: new_password >= 8 chars, confirm_password == new_password, new_password != current_password
- [x] 7.4 Manejar submit: llamar `useChangePassword`, limpiar formulario en éxito, mostrar toast
- [x] 7.5 Manejar errores del servidor en el formulario (contraseña actual incorrecta → toast, errores de validación → inline)

## 8. Frontend — Verificación final

- [x] 8.1 Verificar que `/perfil` carga correctamente con datos del usuario autenticado
- [x] 8.2 Verificar que `/perfil` redirige a `/login?from=/perfil` si no hay sesión
- [x] 8.3 Verificar que un ADMIN no puede acceder a `/perfil` (redirige a `/403`)
- [x] 8.4 Verificar flujo completo: login → editar perfil → guardar → ver cambios reflejados
- [x] 8.5 Verificar flujo de cambio de contraseña: cambiar contraseña → logout → login con nueva contraseña
- [x] 8.6 `npm run build` pasa sin errores TypeScript strict
