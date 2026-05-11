## Context

No existe directorio `frontend/`. El backend tiene su base operativa completa (`infra-backend-core` + `infra-database` archivados). Antes de construir cualquier feature de UI se necesita un casco ejecutable: bundler, framework, estilos, routing skeleton, cliente HTTP y stores de estado cliente.

Este change no implementa lógica de negocio. Produce el equivalente frontend de lo que `infra-backend-core` produjo para el backend: un proyecto que levanta, compila y tiene las herramientas correctas instaladas.

## Goals / Non-Goals

**Goals:**
- Proyecto `frontend/` ejecutable con `npm run dev` (puerto 5173) y `npm run build` sin errores
- TypeScript en modo estricto configurado y funcional
- Tailwind CSS con purging listo para producción
- Axios instance con interceptores JWT (attach Bearer + refresh automático en 401 con manejo de race condition)
- Cuatro stores Zustand con contratos de estado, acciones y política de persistencia definidos
- React Router v6 con scaffold de rutas públicas/privadas (outlets vacíos, sin lógica de auth)
- TanStack Query `QueryClientProvider` en App root
- Estructura FSD de carpetas creada y documentada
- `.env.example` con `VITE_API_BASE_URL` y `VITE_MERCADOPAGO_PUBLIC_KEY`

**Non-Goals:**
- Navegación por rol ni protección real de rutas (eso es `frontend-shell`)
- Lógica de autenticación (eso es `auth`)
- Ningún componente de producto, pedido o pago
- Integración real con MercadoPago SDK (eso es `payment-integration`)
- Páginas reales con contenido (solo outlets/placeholders vacíos)

## Decisions

### D1 — Vite + SWC sobre Vite + Babel
Vite con `@vitejs/plugin-react-swc` compila TypeScript sin forkear Babel, reduce el tiempo de cold start y hot reload de manera notable en proyectos medianos. El proyecto no tiene requerimientos especiales de transformación que obliguen Babel.

### D2 — Feature-Sliced Design (FSD) sobre estructura por tipo de archivo
Una estructura plana (`components/`, `pages/`, `hooks/`) escala mal cuando el proyecto llega a 10+ features. FSD define una dirección de imports estricta (Pages → Features → Entities → Shared → Types) que previene dependencias circulares y facilita agregar features aisladas. El proyecto tiene 19 changes planificados; FSD es la apuesta correcta desde el inicio.

Estructura inicial mínima:
```
frontend/src/
├── pages/          # Pages (componen features + layout)
├── features/       # Features cohesivas (auth, cart, catalog, etc.)
├── entities/       # Modelos de dominio del cliente (User, Product, Order)
├── widgets/        # Bloques UI reutilizables complejos
└── shared/
    ├── api/        # Axios instance + interceptores
    ├── stores/     # Zustand stores
    ├── ui/         # Componentes UI genéricos (Button, Input, etc.)
    ├── lib/        # Utilidades
    └── types/      # Types TypeScript globales
```

### D3 — Zustand sobre Redux Toolkit / Context API
Zustand no requiere providers para stores que no son de UI crítica. `authStore.getState().accessToken` es accesible fuera de React (necesario para el interceptor de Axios). La API de subscripción por slice (`useStore(s => s.field)`) previene re-renders innecesarios. Redux Toolkit añade boilerplate sin beneficio real para este tamaño de aplicación.

### D4 — Interceptor de Axios con cola de espera en refresh (refresh queue pattern)
Si múltiples requests llegan con 401 simultáneamente, un interceptor naive haría N llamadas al endpoint de refresh, fallando todas menos la primera. La solución es un flag `isRefreshing` + una cola de promesas pendientes:
- Cuando llega el primer 401, `isRefreshing = true` y se inicia el refresh
- Los 401 siguientes se encolan (no llaman refresh)
- Cuando el refresh resuelve, la cola se despacha con el nuevo token
- Si el refresh falla (token expirado), la cola entera rechaza y se hace logout

Este patrón vive en `shared/api/axios.ts`. Se implementa íntegramente en este change.

### D5 — Persistencia selectiva en Zustand con `partialize`
- `authStore`: persiste `accessToken`, `refreshToken`, `user` — el estado de sesión debe sobrevivir al reload
- `cartStore`: persiste `items` — el carrito debe sobrevivir cierre del navegador
- `paymentStore`: **sin** persistencia — es estado transitorio de checkout, no debe rehydratarse
- `uiStore`: persiste solo `theme` — las preferencias visuales se recuerdan, el estado de UI transitorio no

### D6 — QueryClient defaults
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutos: reduce refetches innecesarios
      retry: 1,                     // 1 reintento: falla rápido en errores reales
      refetchOnWindowFocus: false,  // No refetch al cambiar de tab (UX del carrito/catalog)
    },
  },
})
```

## Risks / Trade-offs

**[R1] Dependencia circular Axios → authStore → Axios en el interceptor**
→ El interceptor usa `useAuthStore.getState()` (acceso directo al store fuera de React), no el hook. Esto rompe la dependencia circular. Documentado en `shared/api/axios.ts`.

**[R2] FSD puede sentirse over-engineered para el estado actual (solo infra)**
→ Trade-off aceptado conscientemente. El beneficio aparece a partir del change 05 (`auth`) y se amortiza en los 14 changes posteriores. No hacerlo ahora obliga a una refactorización dolorosa más adelante.

**[R3] React Router v6 scaffold vacío puede confundir en code review**
→ Los outlets vacíos se documentan con comentarios de `// TODO: change-auth` para señalar claramente qué change los completa.

**[R4] `VITE_MERCADOPAGO_PUBLIC_KEY` en `.env.example` sin uso real en este change**
→ Se incluye porque US-000c lo especifica explícitamente en los criterios de aceptación. El valor es solo placeholder (`TEST-xxx`). La integración real es responsabilidad de `payment-integration`.

## Open Questions

- **[OQ1] Versión de React Router**: ¿v6 (react-router-dom@6) o migrar a v7 con file-based routing? → Decisión: v6. El proyecto no usa SSR ni TanStack Start, y v7 aún tiene breaking changes frecuentes. Se puede migrar en un change dedicado si es necesario.
- **[OQ2] Método de integración MercadoPago SDK**: ¿`@mercadopago/sdk-react` (CardPayment) o SDK JS vanilla? → Diferido a `payment-integration`. Este change solo instala la dependencia sin inicializarla.
