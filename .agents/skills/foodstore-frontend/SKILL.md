---
name: foodstore-frontend
description: Frontend conventions for Food Store — Feature-Sliced Design, Zustand stores with persistence rules, TanStack Query patterns, TypeScript strict mode, Axios interceptors, and MercadoPago integration. Trigger: When implementing any frontend task including components, pages, stores, hooks, forms, API consumption, or UI patterns.
---

# Food Store — Frontend Conventions

Load this skill before writing ANY frontend code for Food Store. These rules come from `docs/Integrador.txt` and are mandatory.

## Architecture — Feature-Sliced Design (FSD)

Import flow is strictly top-down. No cross-imports between features.

```
Pages → Features → Hooks/Stores → API → Types
```

### Directory Structure

```
src/
├── pages/                   # Route definitions only — delegate to features
├── features/
│   ├── auth/                # LoginForm, RegisterForm, ProtectedRoute HOC
│   ├── store/               # CatalogoGrid, CartDrawer, CheckoutForm
│   ├── pedidos/             # PedidosList, PedidoDetail, HistorialTimeline, PaymentStatus
│   └── admin/               # Dashboard, CRUDs, GestionPedidos, StockTable
├── hooks/                   # TanStack Query hooks: useAuth, useProductos, usePedidos, useAdmin
├── store/                   # Zustand stores: authStore, cartStore, paymentStore, uiStore
├── api/                     # Axios instance + interceptors
├── types/                   # TypeScript interfaces and types
└── components/              # Shared UI components (buttons, modals, skeletons, toasts)
```

### FSD Rules

- **Each feature is self-contained**: its components, hooks, and styles are NOT accessible from other features
- **Pages only define routes** and delegate rendering to features
- **Shared components** go in `components/` — these are the ONLY cross-feature imports allowed
- **No circular imports** between features — if two features need the same thing, extract to `hooks/`, `store/`, or `components/`

## Zustand — 4 Stores with Explicit Persistence

Zustand manages CLIENT state. TanStack Query manages SERVER state. **Mixing both in the same store is an architectural error.**

| Store | File | State | Middleware | Persists |
|-------|------|-------|-----------|----------|
| authStore | `shared/stores/authStore.ts` | accessToken, refreshToken, user, isAuthenticated | `persist` | ✅ accessToken + refreshToken + user + isAuthenticated (partialize) |
| cartStore | `shared/stores/cartStore.ts` | items: CartItem[] | `persist` | ✅ items only (partialize) |
| paymentStore | `shared/stores/paymentStore.ts` | checkoutStep, preferenceId, paymentStatus, error | None | ❌ Resets on reload |
| uiStore | `shared/stores/uiStore.ts` | theme, sidebarOpen, toasts | `persist` | ✅ theme only (partialize) |

### authStore

```typescript
// State
accessToken: string | null
usuario: UserResponse | null
isAuthenticated: boolean

// Actions
login(email, password): Promise<void>
logout(): void
refreshToken(): Promise<void>
hasRole(role: string): boolean

// Persistence: partialize → only accessToken
// On reload: GET /api/v1/auth/me reconstructs usuario
```

### cartStore

```typescript
// State
items: CartItem[]  // producto_id, nombre, precio, cantidad, imagen_url

// Actions
addItem(product): void
removeItem(productoId): void
clearCart(): void
updateCantidad(productoId, cantidad): void

// Computed
subtotal(): number
costoEnvio(): number  // Fixed 50.00 in v1
total(): number       // subtotal + costoEnvio

// Persistence: complete items array
```

### Store Consumption Rules

```typescript
// ✅ CORRECT — subscribe by slice (avoids unnecessary re-renders)
const itemCount = useCartStore(s => s.itemCount())

// ✅ CORRECT — extract actions without re-render
const { addItem } = useCartStore()

// ❌ WRONG — never subscribe to the full store without selector
const store = useCartStore()

// ✅ CORRECT — access outside React (interceptors)
useAuthStore.getState().accessToken
```

## TanStack Query v5 — Server State

- **All data fetching** uses `useQuery` / `useMutation` — never raw `useEffect` + `fetch`
- **queryKeys** must be descriptive: `['productos', { page, search }]`, not `['data']`
- **Invalidate after mutations**: `queryClient.invalidateQueries({ queryKey: ['productos'] })`
- **Interceptor**: automatic 401 refresh — if access token expired, call `/auth/refresh`, retry original request
- **Custom hooks per domain**: `useProductos()`, `usePedidos()`, `useAuth()`, `useAdmin()`

```typescript
// ✅ CORRECT pattern — custom hook wrapping TanStack Query
export function useProductos(filters: ProductoFilters) {
  return useQuery({
    queryKey: ['productos', filters],
    queryFn: () => api.getProductos(filters),
  })
}
```

## TypeScript Conventions

- `strict: true` in tsconfig — no exceptions
- **Never use `any`** — use `unknown` if type is truly unknown, then narrow
- Prefer `interface` for object shapes that extend, `type` for unions/intersections
- All API responses typed — no untyped fetch calls

## Axios — HTTP Client

- Single Axios instance in `api/axios.ts` with base URL from `VITE_API_URL`
- **Request interceptor**: adds `Authorization: Bearer <token>` from authStore
- **Response interceptor**: on 401, attempts refresh token flow, retries original request
- Access token comes from `useAuthStore.getState().accessToken` (outside React)

## MercadoPago — Frontend Integration

- Use `@mercadopago/sdk-react` for `CardPayment` component
- Card data is tokenized by MercadoPago.js → produces `card_token`
- **Card data NEVER passes through Food Store's server** (PCI SAQ-A compliance)
- Frontend calls `POST /api/v1/pagos/crear` with the token
- After payment, use polling (30s interval) to check payment status
- Display `status_detail` to user on rejection

## UX Patterns — Mandatory for Rubric

The rubric evaluates these specifically (10 pts for UI/UX):

| Pattern | Where | Details |
|---------|-------|---------|
| Skeleton loaders | Product lists, order lists | Shown while data is loading |
| Toasts | After mutations | Success/error feedback |
| Confirmation modals | Delete actions, cancel order | Prevent accidental destructive actions |
| Empty states | Lists with no data | Meaningful message + action |
| Mobile-first | All layouts | Responsive design starting from mobile |
| Debounce | Search inputs | Avoid excessive API calls |
| Pagination | Product catalog, orders | Server-side with page/size params |
| Optimistic updates | Cart operations | Update UI immediately, rollback on error |

## Design System

- **Tailwind CSS v3** — utility-first styling
- Consistent design system across all pages
- Design tokens defined in `tailwind.config.js`

## What Frontend NEVER Does

- Invent endpoints that don't exist in backend
- Invent payloads or redefine response shapes
- Redefine business rules from the domain
- Compensate a broken backend with permanent hacks
- Change an API contract without coordinating with root CLAUDE.md
