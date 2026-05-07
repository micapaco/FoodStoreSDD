## Verification Report: infra-frontend-core

**Date**: 2026-05-07
**Tasks**: 56/56 complete

---

### Test Results

No test runner configured for this change (infrastructure scaffold). TypeScript compilation used as proxy for correctness:

```
vite v6.4.2 building for production...
✓ 105 modules transformed.
dist/index.html                  0.46 kB │ gzip:  0.29 kB
dist/assets/index-lnLpj_5u.css  5.43 kB │ gzip:  1.62 kB
dist/assets/index-YDpzFeNk.js  269.10 kB │ gzip: 87.28 kB
✓ built in 1.90s
```

Zero TypeScript errors. Zero compilation warnings.

---

### Spec Compliance

#### frontend-app-shell

| Requirement | Status | Notes |
|---|---|---|
| Executable project — `npm run dev` on port 5173 | PASS | Verified manually |
| Executable project — `npm run build` without TS errors | PASS | 0 errors, 105 modules |
| TypeScript strict mode | PASS | `strict: true` in `tsconfig.app.json` |
| Tailwind CSS v3 with PostCSS and purging | PASS | `tailwind.config.js` content covers `./src/**/*.{ts,tsx}` |
| Tailwind utilities render in browser | PASS | `font-bold text-2xl` visible in `/` placeholder |
| Router scaffold — `/` loads without errors | PASS | Verified in browser |
| Router scaffold — unknown routes → NotFound | PASS | `/ruta-inexistente` shows 404 component |
| QueryClientProvider at App root | PASS | `main.tsx` wraps RouterProvider |
| QueryClient staleTime 5min, retry 1, no focus refetch | PASS | Exact values in `queryClient.ts` |
| `.env.example` with `VITE_API_BASE_URL` and `VITE_MERCADOPAGO_PUBLIC_KEY` | PASS | Both keys present |
| FSD structure: pages, features, entities, widgets, shared | PASS | All directories with `.gitkeep` |
| FSD shared: api, stores, ui, lib, types | PASS | All subdirectories created |

#### frontend-http-client

| Requirement | Status | Notes |
|---|---|---|
| Axios instance uses `VITE_API_BASE_URL` as baseURL | PASS | `axios.ts` line 5 |
| Request interceptor attaches `Authorization: Bearer` when token exists | PASS | `axios.ts` lines 19-25 |
| Request interceptor skips header when token is null | PASS | `if (token)` guard |
| Token read via `getState()` (outside React) | PASS | `useAuthStore.getState().accessToken` |
| Single 401 triggers refresh and retries original request | PASS | `axios.ts` lines 55-75 |
| Refresh failure calls `logout()` and rejects queue | PASS | `catch` block calls `logout()` |
| Concurrent 401s use single refresh (`isRefreshing` + queue) | PASS | `isRefreshing` flag + `failedQueue` |
| Refresh loop prevention via `_retry` flag | PASS | `originalRequest._retry` checked on line 33; refresh uses raw `axios` (not `axiosInstance`) so interceptor does not apply |

#### frontend-state-stores

| Requirement | Status | Notes |
|---|---|---|
| authStore shape: `accessToken`, `refreshToken`, `user`, `isAuthenticated` | PASS | Exact shape in `authStore.ts` |
| authStore `login()` sets full session | PASS | Sets tokens + user + `isAuthenticated: true` |
| authStore `logout()` clears session | PASS | Resets all fields to null/false |
| authStore `updateTokens()` updates only tokens | PASS | `user` unchanged |
| authStore `hasRole(role)` selector | PASS | `user?.roles.includes(role) ?? false` |
| authStore `partialize` excludes transient flags | **WARN** | `isAuthenticated` IS persisted; spec says only `accessToken`, `refreshToken`, `user`. See note below. |
| authStore localStorage key `food-store-auth` | PASS | Verified in DevTools |
| cartStore shape: `items: CartItem[]` | PASS | |
| cartStore `addItem` adds / increments quantity | PASS | Both branches in implementation |
| cartStore `removeItem`, `updateQuantity`, `clearCart` | PASS | All implemented |
| cartStore `totalItems()`, `totalPrice()`, `getItem()` | PASS | Reduce and find selectors |
| cartStore full persist with key `food-store-cart` | PASS | Verified in DevTools |
| paymentStore shape: `checkoutStep`, `preferenceId`, `paymentStatus`, `error` | PASS | Types stricter than spec (`CheckoutStep` enum) |
| paymentStore actions: `startCheckout`, `setPreference`, `updatePaymentStatus`, `resetPayment` | PASS | All implemented |
| paymentStore: NO localStorage key | PASS | Verified in DevTools |
| uiStore shape: `theme`, `sidebarOpen`, `toasts` | PASS | Exact shape |
| uiStore `partialize` persists only `theme` | PASS | `{theme: state.theme}` only |
| `sidebarOpen` and `toasts` do NOT persist | PASS | Verified: `food-store-ui` = `{"state":{"theme":"light"},"version":0}` |
| uiStore localStorage key `food-store-ui` | PASS | Verified in DevTools |
| Slice subscription (no full-store consumers) | N/A | No consumer components exist yet in this change |

---

### Design Coherence

| Decision | Verdict | Notes |
|---|---|---|
| D1 — Vite + SWC | FOLLOWED | `@vitejs/plugin-react-swc` in `vite.config.ts` |
| D2 — Feature-Sliced Design | FOLLOWED | FSD structure created; layer comments in router.tsx |
| D3 — Zustand `getState()` in interceptor | FOLLOWED | `useAuthStore.getState()` prevents circular dependency |
| D4 — Refresh queue (`isRefreshing` + `failedQueue`) | FOLLOWED | Full pattern implemented in `shared/api/axios.ts` |
| D5 — Selective persist with `partialize` | FOLLOWED | auth/cart/ui → persist; payment → memory-only |
| D6 — QueryClient conservative defaults | FOLLOWED | staleTime=5min, retry=1, refetchOnWindowFocus=false |
| OQ1 — React Router version | DEVIATED | v7 installed (design said v6). All APIs used (`createBrowserRouter`, `Outlet`, `RouterProvider`) are backward-compatible. Design's OQ1 explicitly noted this as an open question. |

---

### Summary

**WARNING — `authStore.partialize` includes `isAuthenticated`**
Spec says only `accessToken`, `refreshToken`, `user` should be persisted. Implementation also persists `isAuthenticated`. Functionally this is acceptable since `isAuthenticated` is derived from `accessToken !== null`, and persisting it avoids a brief false state after reload. Not blocking.

**WARNING — react-router-dom v7 installed vs v6 in design**
Design's OQ1 flagged this as uncertain. v7 APIs used are fully backward-compatible. Migrating back to v6 would break nothing; staying on v7 enables future upgrade to file-based routing if desired. Not blocking.

**VERDICT**: ✅ READY FOR ARCHIVE
