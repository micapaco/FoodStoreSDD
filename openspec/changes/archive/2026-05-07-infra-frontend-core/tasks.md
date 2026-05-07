## 1. Proyecto Vite + React + TypeScript

- [x] 1.1 Crear el proyecto con `npm create vite@latest frontend -- --template react-swc-ts` en la raíz del repositorio
- [x] 1.2 Verificar que `tsconfig.json` tiene `"strict": true` y `"target": "ESNext"`
- [x] 1.3 Agregar `"baseUrl": "."` y `"paths": { "@/*": ["./src/*"] }` en `tsconfig.json`
- [x] 1.4 Instalar dependencias core: `react-router-dom @tanstack/react-query @tanstack/react-form zustand axios recharts @mercadopago/sdk-react`
- [x] 1.5 Instalar dependencias de Zustand persist: `@tanstack/react-query-devtools` (solo dev)
- [x] 1.6 Instalar dev deps: `@types/react @types/react-dom typescript`
- [x] 1.7 Verificar que `npm run dev` inicia sin errores en puerto 5173
- [x] 1.8 Verificar que `npm run build` compila sin errores TypeScript

## 2. Tailwind CSS

- [x] 2.1 Instalar Tailwind y PostCSS: `npm install -D tailwindcss postcss autoprefixer`
- [x] 2.2 Ejecutar `npx tailwindcss init -p` para generar `tailwind.config.js` y `postcss.config.js`
- [x] 2.3 Configurar `content` en `tailwind.config.js` para purging: `["./index.html", "./src/**/*.{ts,tsx}"]`
- [x] 2.4 Agregar las directivas `@tailwind base/components/utilities` en `src/index.css`
- [x] 2.5 Verificar que una clase Tailwind en `App.tsx` (e.g., `bg-blue-500`) se aplica correctamente en el browser

## 3. Variables de entorno

- [x] 3.1 Crear `frontend/.env.example` con: `VITE_API_BASE_URL=http://localhost:8000/api/v1` y `VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxx`
- [x] 3.2 Crear `frontend/.env` copiando `.env.example` con los mismos valores (para desarrollo local)
- [x] 3.3 Agregar `frontend/.env` a `.gitignore` si no está incluido

## 4. Estructura Feature-Sliced Design

- [x] 4.1 Crear directorio `src/pages/` con `.gitkeep`
- [x] 4.2 Crear directorio `src/features/` con `.gitkeep`
- [x] 4.3 Crear directorio `src/entities/` con `.gitkeep`
- [x] 4.4 Crear directorio `src/widgets/` con `.gitkeep`
- [x] 4.5 Crear directorio `src/shared/api/` con `.gitkeep`
- [x] 4.6 Crear directorio `src/shared/stores/` con `.gitkeep`
- [x] 4.7 Crear directorio `src/shared/ui/` con `.gitkeep`
- [x] 4.8 Crear directorio `src/shared/lib/` con `.gitkeep`
- [x] 4.9 Crear directorio `src/shared/types/` con `.gitkeep`

## 5. TanStack Query — QueryClient

- [x] 5.1 Crear `src/shared/lib/queryClient.ts` con `QueryClient` configurado: `staleTime: 5min`, `retry: 1`, `refetchOnWindowFocus: false`
- [x] 5.2 Envolver `<App />` en `main.tsx` con `<QueryClientProvider client={queryClient}>`
- [x] 5.3 Agregar `<ReactQueryDevtools />` en desarrollo (condicional por `import.meta.env.DEV`)

## 6. React Router v6 — Scaffold de rutas

- [x] 6.1 Crear `src/app/router.tsx` con `createBrowserRouter` y rutas públicas y privadas como outlets vacíos
- [x] 6.2 Definir rutas públicas: `/` (home placeholder), `/login` (placeholder), `/register` (placeholder)
- [x] 6.3 Definir rutas privadas bajo `/app` con `<Outlet />` vacío (la protección real llega en `frontend-shell`)
- [x] 6.4 Agregar ruta fallback `path: "*"` con un componente `NotFound` mínimo
- [x] 6.5 Envolver la app con `<RouterProvider router={router} />` en `main.tsx`
- [x] 6.6 Verificar en el browser que `/` carga sin errores de routing

## 7. Axios — HTTP client con interceptores JWT

- [x] 7.1 Crear `src/shared/api/axios.ts` con instancia `axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })`
- [x] 7.2 Implementar interceptor de request: leer `useAuthStore.getState().accessToken` y agregar `Authorization: Bearer <token>` si existe
- [x] 7.3 Declarar variables de control para el refresh queue: `let isRefreshing = false` y `let failedQueue: Array<{resolve, reject}> = []`
- [x] 7.4 Implementar `processQueue(error, token)` que resuelve o rechaza cada entrada de la cola
- [x] 7.5 Implementar interceptor de response que en 401:
  - Si `isRefreshing` es false: inicia el refresh, llama `POST /auth/refresh`, actualiza authStore con `updateTokens()`
  - Si `isRefreshing` es true: encola la promesa y espera
  - Al resolver: llama `processQueue(null, newToken)` y retries la petición original
  - Al fallar: llama `processQueue(error, null)`, llama `authStore.logout()`, rechaza la promesa
- [x] 7.6 Asegurar que el interceptor no entra en loop cuando el endpoint de refresh devuelve 401 (verificar con flag de `_retry` en el config de la petición original)
- [x] 7.7 Exportar `axiosInstance` como default desde `shared/api/axios.ts`

## 8. Zustand Stores

- [x] 8.1 Instalar middleware de persistencia (ya viene con zustand): verificar que `zustand/middleware` está disponible
- [x] 8.2 Crear `src/shared/stores/authStore.ts` con:
  - Estado: `accessToken`, `refreshToken`, `user`, `isAuthenticated`
  - Acciones: `login(tokens, user)`, `logout()`, `updateTokens(tokens)`
  - Selectores: `isAuthenticated` (derivado), `hasRole(role)`
  - `persist` con `partialize` que excluye flags transitorios
  - Clave localStorage: `food-store-auth`
- [x] 8.3 Crear `src/shared/stores/cartStore.ts` con:
  - Estado: `items: CartItem[]`
  - Acciones: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
  - Selectores: `totalItems()`, `totalPrice()`, `getItem(productoId)`
  - `persist` completo con clave `food-store-cart`
- [x] 8.4 Crear `src/shared/stores/paymentStore.ts` con:
  - Estado: `checkoutStep`, `preferenceId`, `paymentStatus`, `error`
  - Acciones: `startCheckout(pedidoId)`, `setPreference(preferenceId)`, `updatePaymentStatus(status)`, `resetPayment()`
  - **Sin** `persist` middleware
- [x] 8.5 Crear `src/shared/stores/uiStore.ts` con:
  - Estado: `theme: 'light' | 'dark'`, `sidebarOpen: boolean`, `toasts: Toast[]`
  - Acciones: `setTheme`, `toggleSidebar`, `addToast(toast)`, `removeToast(id)`
  - `persist` con `partialize` que incluye **solo** `theme`
  - Clave localStorage: `food-store-ui`
- [x] 8.6 Definir el tipo `CartItem` en `src/shared/types/cart.ts` y el tipo `Toast` en `src/shared/types/ui.ts`
- [x] 8.7 Crear `src/shared/stores/index.ts` que re-exporta todos los stores

## 9. App root — main.tsx y App.tsx

- [x] 9.1 Actualizar `src/main.tsx` para incluir: `QueryClientProvider`, `RouterProvider`, e importar `index.css`
- [x] 9.2 Actualizar `src/App.tsx` para ser un componente mínimo funcional (o eliminar si RouterProvider lo reemplaza)
- [x] 9.3 Verificar que `vite.config.ts` tiene el alias `@` apuntando a `./src`

## 10. Verificación final

- [x] 10.1 Ejecutar `npm run dev` y confirmar que el servidor arranca en puerto 5173 sin errores en consola
- [x] 10.2 Ejecutar `npm run build` y confirmar que TypeScript compila sin errores
- [x] 10.3 Verificar en el browser que `/` carga, `/login` carga, y `/ruta-inexistente` muestra el componente NotFound
- [x] 10.4 Verificar en DevTools → Application → LocalStorage que los stores configurados con `persist` crean sus claves (`food-store-auth`, `food-store-cart`, `food-store-ui`)
- [x] 10.5 Verificar que `paymentStore` NO crea clave en localStorage
