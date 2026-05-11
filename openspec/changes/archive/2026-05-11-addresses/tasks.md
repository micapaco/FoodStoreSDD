## 1. Backend — Módulo Direcciones

- [x] 1.1 Crear estructura del módulo `backend/app/modules/direcciones/` (router/service/repository/schemas/model) según feature-first
- [x] 1.2 Definir/ajustar modelo `DireccionEntrega` (campos + FK usuario + `es_principal`) respetando ERD v5
- [x] 1.3 Implementar repository con queries por `usuario_id` y exclusión de soft-deleted por defecto
- [x] 1.4 Implementar service: listar propias direcciones
- [x] 1.5 Implementar service: crear dirección (si es la primera del usuario → `es_principal=true`)
- [x] 1.6 Implementar service: actualizar dirección propia
- [x] 1.7 Implementar service: eliminar dirección propia (204)
- [x] 1.8 Implementar service: marcar dirección como principal (unsetting del resto en misma transacción)

## 2. Backend — API REST + Seguridad

- [x] 2.1 Implementar router `GET /api/v1/direcciones` (CLIENT)
- [x] 2.1.1 Implementar router `GET /api/v1/direcciones/{id}` (CLIENT)
- [x] 2.2 Implementar router `POST /api/v1/direcciones` (CLIENT)
- [x] 2.3 Implementar router `PUT /api/v1/direcciones/{id}` (CLIENT)
- [x] 2.4 Implementar router `DELETE /api/v1/direcciones/{id}` (CLIENT)
- [x] 2.5 Implementar router `PATCH /api/v1/direcciones/{id}/principal` (CLIENT)
- [x] 2.6 Garantizar ownership: acceso a id ajeno retorna 404 (no filtrar información)
- [x] 2.7 Documentar schemas request/response (Create/Update/Read) y validar 422 en payload inválido
- [x] 2.8 Registrar el router en el app shell bajo `/api/v1`

## 3. Frontend — Feature “Mis Direcciones”

- [x] 3.1 Agregar route `/direcciones` dentro del router del shell con guards (ProtectedRoute + RoleRoute CLIENT)
- [x] 3.2 Crear feature/página “Mis Direcciones” (listado + estado vacío + loading)
- [x] 3.3 Implementar TanStack Query: `useAddressesQuery` (GET /direcciones)
- [x] 3.4 Implementar TanStack Query mutations: create/update/delete/set principal + invalidación del listado
- [x] 3.5 Implementar formulario de dirección (TanStack Form) con validaciones básicas
- [x] 3.6 Implementar UI para marcar principal y reflejar indicador `principal`

## 4. Verificación

- [x] 4.1 Verificar que los specs del change se cumplen (API + UI + guards) y que `openspec status --change "addresses"` queda apply-ready
