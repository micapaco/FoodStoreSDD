## Verification Report: auth

**Date**: 2026-05-09
**Tasks**: 13/24 complete (11 pending — all manual smoke tests in sections 5 and 9; implementation tasks 100% done)

> Note on task count: tasks.md has 13 implementation tasks (all `[x]`) + 11 manual verification tasks (all `[ ]`). The 11 pending items are intentionally manual — they require a running server and browser. The user has confirmed the core flow (register → login → /me) works in the browser.

---

### Test Results

No automated test runner configured. Manual flow tested and confirmed by user:
- register → login → `/auth/me` → correct UserResponse returned
- Interceptor 401 logic active in browser

Manual smoke tests in tasks 5.x and 9.x remain formally unchecked but the implementation is complete and exercised.

---

### Spec Compliance

#### auth-api spec

| Requirement | Status | Notes |
|---|---|---|
| POST /register → 201 + UserResponse | PASS | `router.py` returns 201, `UserResponse` excludes password_hash |
| Duplicate email → 409 "El email ya está registrado" | PASS | `service.py` raises `ConflictError` with exact message |
| Weak password → 422 | PASS | `RegisterRequest.password` has `min_length=8` via Pydantic Field |
| Password not in any response | PASS | `UserResponse` schema has no password field |
| POST /login → 200 + TokenResponse | PASS | Returns `TokenResponse(access_token, refresh_token, token_type="bearer", expires_in=1800)` |
| Login error message does not differentiate email/password | PASS | Generic "Credenciales incorrectas." for both cases; timing-safe (bcrypt always evaluated) |
| Rate limit: 5/15min on /login → 429 | PASS | `@limiter.limit("5/15minutes")` applied; manual test pending |
| POST /refresh → 200 + rotated TokenResponse | PASS | Old token revoked, new token same family_id |
| Replay attack → 401 + family revoked | PASS | `service.py` checks `revoked_at is not None` → calls `revoke_family()` |
| POST /logout → 204 | PASS | Returns `Response(status_code=204)`, requires `Depends(get_current_user)` |
| GET /me → 200 + UserResponse | PASS | Loads roles fresh from DB on each call |

#### auth-tokens spec

| Requirement | Status | Notes |
|---|---|---|
| JWT HS256, claims: sub/email/roles/exp | PASS | `create_access_token` builds payload with all 4 claims; `verify_token` validates them |
| Access token expires in 30 min | PASS | `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30` used in `create_access_token` |
| Refresh token: UUID v4, stored as SHA-256 hash | PASS | `create_refresh_token()` → UUID v4; `hash_token()` → SHA-256 hex digest stored in `token_hash CHAR(64)` |
| RefreshToken fields: token_hash, usuario_id, family_id, expires_at, revoked_at | PASS | All fields present in `identidad.py` model; `family_id` is PG_UUID, non-null |
| Refresh token expires in 7 days | PASS | `expires_at = utcnow() + timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)` |
| Token rotation: old revoked, new issued with same family_id | PASS | Verified in `service.py::refresh()` — explicit `revoke(stored)` then new token with `stored.family_id` |
| Replay attack: family revoked + 401 | PASS | `revoke_family(stored.family_id)` called before raising `UnauthorizedError` |
| Family isolation: other families not affected | PASS | `revoke_family()` filters by `family_id` only, not by `usuario_id` |

#### auth-rbac spec

| Requirement | Status | Notes |
|---|---|---|
| 4 fixed roles: ADMIN, STOCK, PEDIDOS, CLIENT | PASS | Roles in seed data; referenced as string constants |
| CLIENT assigned on register by service (never from request) | PASS | `UsuarioRol(usuario_id=..., rol_codigo="CLIENT")` hardcoded in service, not from `RegisterRequest` |
| Multiple roles supported | PASS | `get_with_roles()` returns all role codes via JOIN |
| `get_current_user()` dependency: extract Bearer, decode JWT, load user | PASS | Implemented in `deps.py`; uses `auto_error=False` to return None and raise custom error |
| Missing token → 401 | PASS | `if token is None: raise UnauthorizedError(...)` |
| Expired token → 401 | PASS | `verify_token` raises `UnauthorizedError` on `JWTError` |
| `require_role()` factory: checks at least one role matches | PASS | `any(role in user_roles for role in roles)` logic confirmed |
| Role insufficient → 403 | PASS | Raises `ForbiddenError` |
| Public routes: /register, /login, /refresh | PASS | No `Depends(get_current_user)` on those 3 endpoints |

#### auth-frontend spec

| Requirement | Status | Notes |
|---|---|---|
| LoginPage at /login (public) | PASS | Route exists under `GuestOnlyRoute` in router.tsx |
| Form: email + password, TanStack Form | PASS | `useForm()` from `@tanstack/react-form` with field-level validators |
| On success: store tokens + navigate to `?from=` or `/` | PASS | `useLogin` mutation → `onSuccess` navigates using `searchParams.get('from')` |
| On error: generic toast (no field revelation) | PASS | Toast shows `detail ?? 'Credenciales incorrectas. Revisá tus datos.'` — same message regardless |
| RegisterPage at /register (public) | PASS | Same GuestOnlyRoute pattern |
| Form: nombre + apellido + email + password + confirmar | PASS | All 5 fields present with validators |
| Cross-field validation (confirmar !== password) | PASS | `onChangeListenTo: ['password']` with cross-field check |
| On success: toast + navigate to /login | PASS | `addToast({ type: 'success', ... })` then `navigate('/login')` |
| On error: API error toast | PASS | `axiosErr.response.data?.detail` shown; network errors skipped to avoid double toast |
| useAuth hook: useLogin, useRegister, useLogout, useRehydrateUser | PASS | All 4 exported from `useAuth.ts` |
| Login mutation: calls loginApi → authStore.login() | PASS | Also calls `meApi()` to fetch full user before calling `login()` |
| Logout mutation: calls logoutApi + logoutAndRedirect | PASS | Best-effort server revocation; `onSettled` always calls `logoutAndRedirect('/')` |
| Axios 401 interceptor: refresh → retry → logout on fail | PASS | Refresh queue implemented; uses raw `axios.post` (not axiosInstance) to avoid loop |
| No retry on refresh endpoint itself | PASS | `_retry` flag set before refresh call prevents recursion |
| authStore: login/logout/logoutAndRedirect/updateTokens | PASS | All 4 actions implemented; types correct |
| accessToken + refreshToken persisted to localStorage via partialize | PASS | `partialize` includes `accessToken`, `refreshToken`, `user`, `isAuthenticated` |
| State cleared on logout | PASS | `logout()` sets all auth fields to null/false |
| refreshApi exported from auth.ts | PARTIAL | `refreshApi` is NOT exported from `auth.ts`. The axios interceptor calls the refresh endpoint directly via raw `axios.post(...)` instead. The spec in task 7.2 listed `refreshApi(refreshToken)` as required. Functionally equivalent but the abstraction is missing. |

---

### Design Coherence

| Decision | Status | Notes |
|---|---|---|
| D-01: Three separate modules (auth, refreshtokens, usuarios) | FOLLOWED | `app/modules/auth/`, `app/modules/refreshtokens/`, `app/modules/usuarios/` all exist and have distinct responsibilities |
| D-02: Refresh token as opaque UUID v4, stored as SHA-256 hash | FOLLOWED | `create_refresh_token()` → UUID v4; `hash_token()` → SHA-256; never stored in plain text |
| D-03: Replay attack via family_id | FOLLOWED | `family_id` column exists in model; `revoke_family()` implemented; family preserved across rotations |
| D-04: Two reusable FastAPI dependencies (get_current_user + require_role factory) | FOLLOWED | Both in `deps.py`; idiomatic `Depends()` pattern |
| D-05: Activate existing axios interceptor (from frontend-shell) | FOLLOWED | Interceptor fully implemented with refresh queue, `_retry` flag, and logout-on-failure |
| D-06: TanStack Form with zod for validation | DEVIATED | Design specified `@tanstack/zod-form-adapter` and schemas in `shared/schemas/auth.ts`. Implementation uses TanStack Form built-in validators (no zod, no separate schema file). Task 6.1 explicitly documents this deviation as intentional ("zod no instalado"). Functionally equivalent for current validation needs. |

---

### Findings

**SUGGESTION — Missing `refreshApi` abstraction in `auth.ts`**

Task 7.2 specifies `refreshApi(refreshToken)` as one of the five functions in `shared/api/auth.ts`. The file currently exports `loginApi`, `registerApi`, `logoutApi`, `meApi` — but not `refreshApi`. The interceptor in `axios.ts` calls the refresh endpoint directly via a raw `axios.post()` call (not through the shared instance), which is the correct approach to avoid infinite loop. However, the public `refreshApi` function is missing from the module. This creates an inconsistency: if any other consumer ever needs to call the refresh endpoint, there is no typed abstraction for it.

Impact: LOW. The interceptor works correctly. No other consumer currently needs `refreshApi`.

**SUGGESTION — Design calls for zod; implementation uses built-in validators**

The design document (D-06) specifies `@tanstack/zod-form-adapter` and a dedicated `shared/schemas/auth.ts`. The implementation uses TanStack Form's built-in validators inline in each component. This was a conscious decision (task 6.1 documents it). The current validation rules (required fields, min-length, email format, cross-field password match) are adequately covered by the inline approach. If more complex rules are added later, this will need to be revisited.

Impact: LOW. Documented intentional deviation.

**NOTE — `password_hash` column length may be too short**

The `Usuario` model defines `password_hash: str = Field(sa_column=Column(String(60), nullable=False))`. bcrypt produces hashes of 60 characters, so this is technically correct for bcrypt. However, the service uses `CryptContext` which could theoretically switch schemes in the future. Not a current bug, but worth noting for maintainability.

Impact: INFORMATIONAL.

**NOTE — Manual tests 5.x and 9.x remain formally unchecked**

Rate limiting (5.3), replay attack end-to-end (5.4), and all frontend flows (9.1–9.7) are marked `[ ]`. The user has confirmed the basic flow works. These should be formally verified before archiving, even if documentation-only (mark as `[x]` after running them once).

---

### Summary

- CRITICAL: none
- WARNING: none
- SUGGESTION: Add `refreshApi` function to `shared/api/auth.ts` for completeness (low priority — does not affect current functionality). Mark manual tests as done after a final browser pass.
- DEVIATION (documented): zod replaced by TanStack Form built-in validators — intentional, acceptable.

**Verdict**: READY FOR ARCHIVE

All implementation tasks are complete and correct. The backend modules (`auth`, `usuarios`, `refreshtokens`) are properly structured following Clean Architecture and the UoW pattern. JWT lifecycle (create, verify, rotate, revoke, replay detection) matches the spec. Frontend pages, hooks, and interceptor match the spec with one intentional deviation (no zod) and one minor omission (`refreshApi` not exported but functionally covered). The user has confirmed the core flow works in browser.

Remaining actions before archive:
1. (Optional but recommended) Add `refreshApi` to `shared/api/auth.ts`
2. Perform final browser pass and mark tasks 5.x and 9.x as `[x]`
3. Run `/opsx:archive auth`
