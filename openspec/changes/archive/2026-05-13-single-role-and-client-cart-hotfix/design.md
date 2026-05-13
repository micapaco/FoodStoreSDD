# Design

## Backend
`PATCH /api/v1/admin/usuarios/{id}/roles` remains a full replacement endpoint with body `{ roles: string[] }`, but the request validator now requires length exactly one and one of the fixed role codes.

Keeping `roles` as a list avoids breaking the existing response/token shape and minimizes API churn. The business invariant changes from "at least one role" to "exactly one role".

## Frontend
`UsersAdminPage` keeps displaying roles as badges, but edit mode uses a `<select>` with the four role codes. Save sends `{ roles: [selectedRole] }`.

`PrivateHeader` derives roles through `getSafeUserRoles()` and exposes cart controls only when the role set is exactly `['CLIENT']`.

## Non-Goals
- Do not migrate the `usuario_rol` join table.
- Do not rewrite auth token shape.
- Do not change route guards beyond cart visibility.
