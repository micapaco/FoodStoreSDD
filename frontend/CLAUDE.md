# Frontend — Food Store

## Stack
- React 18 + TypeScript (strict: true) — skill instalada: `react-dev`
- Vite (build tool) — skill instalada: `vite`
- Tailwind CSS v3 — skill instalada: `tailwind-css-patterns`
- Zustand (authStore, cartStore, paymentStore, uiStore)
- TanStack Query v5 (estado del servidor) — skill instalada: `tanstack-query-best-practices`
- TanStack Form (formularios) — skill instalada: `tanstack-form`
- Axios (cliente HTTP con interceptores JWT)
- recharts (gráficos del panel admin)
- @mercadopago/sdk-react (tokenización PCI SAQ-A)

## Qué hace este dominio
- Componentes UI (Feature-Sliced Design)
- Estado del cliente (Zustand)
- Estado del servidor (TanStack Query)
- Formularios con validación (TanStack Form)
- Consumo de API (Axios + interceptores)
- Lógica de presentación
- Integración MercadoPago en browser (CardPayment, tokenización)

## Qué NO hace este dominio
- Inventar endpoints que no existen en el backend
- Inventar payloads o redefinir respuestas
- Redefinir reglas de negocio del dominio
- Compensar backend roto con hacks permanentes
- Cambiar un contrato API sin coordinar con el root primero

## Qué leer primero
Antes de cualquier acción, leer en este orden:

1. `docs/Descripcion.txt` — foco en secciones de UI, estado y formularios
2. `docs/Integrador.txt` — foco en contratos API disponibles y restricciones de integración
3. `docs/Historias_de_usuario.txt` — foco en historias de interfaz, estado y flujos de usuario
4. `docs/CHANGES.md` — verificar qué changes de backend están archivados antes de consumir un endpoint

No asumir que un endpoint existe si el contrato no está definido. Verificar el estado del change antes de operar:
- Si el change no fue propuesto → no implementar, ir a `/opsx:propose`
- Si el change está propuesto pero no archivado → trabajo activo; el frontend puede avanzar solo si el contrato API ya está explicitado y acordado
- Si el change está archivado → cualquier cambio nuevo requiere evaluar un nuevo change

## Auto-load de skills

**Antes de escribir cualquier código de frontend**, seguí estos pasos en orden:

1. **Buscá la categoría** de la tarea en la tabla de abajo
2. **Ejecutá `find-skills`** con la tecnología de la categoría para buscar skills del ecosistema (ej: `npx skills find "react zustand"`)
   - Si encontrás una skill relevante con buen rating → instalala y usala
   - Si no encontrás → seguí con el paso 3
3. **Cargá `clean-architecture`** — se carga SIEMPRE, en toda tarea de código, sin excepción. Aplica a frontend también: separación de concerns, dirección de imports (Pages→Features→Hooks→API→Types), no meter lógica de negocio en componentes.
4. **Cargá la skill de proyecto** indicada en la columna "Skill de proyecto" — estas tienen las convenciones específicas de Food Store
5. **Recién ahí escribí código** — con la guía de las tres capas: ecosystem (genérica) + clean-architecture (principios) + foodstore-* (convenciones del proyecto)

## Tabla de categorías

> Las skills `openspec-*` son skills del **workflow OPSX** (especificación, diseño, tasks, verificación).
> No son skills técnicas del dominio frontend. Usarlas cuando el trabajo es sobre artefactos SDD, no cuando el trabajo es código React/TS.
>
> Las skills `foodstore-*` son skills **técnicas del proyecto**. Contienen las convenciones, patrones y reglas de Food Store extraídas de `docs/Integrador.txt`. Cargarlas SIEMPRE antes de escribir código.

| Categoría | find-skills query | Skill de proyecto | Cuándo usarla |
|---|---|---|---|
| **Workflow OPSX** | | | |
| Diseño de un change | — | `openspec-design` | Diseñar el approach técnico de un change |
| Escritura de specs | — | `openspec-spec` | Documentar contratos de UI, estado, flujos |
| Desglose en tasks | — | `openspec-tasks` | Convertir un change en checklist implementable |
| Verificar implementación | — | `openspec-verify` | Validar que el código cumple las specs |
| **Dominio técnico frontend** | | | |
| Componentes UI / React | ✅ `react-dev` instalada | `foodstore-frontend` | Componentes, páginas, widgets (FSD) |
| Estilos / Tailwind CSS | ✅ `tailwind-css-patterns` instalada | `foodstore-frontend` | Clases utilitarias, diseño responsivo, dark mode |
| Estado del cliente / Zustand | `"zustand react state"` | `foodstore-frontend` | authStore, cartStore, paymentStore, uiStore |
| Estado del servidor / TanStack Query | ✅ `tanstack-query-best-practices` instalada | `foodstore-frontend` | useQuery, useMutation, invalidación de cache |
| Build tool / Vite | ✅ `vite` instalada | — | vite.config.ts, plugins, proxy, env vars |
| Formularios / TanStack Form | ✅ `tanstack-form` instalada | `foodstore-frontend` | Validación, submit, campos controlados |
| Cliente HTTP / Axios | `"axios interceptors jwt"` | `foodstore-frontend` | Interceptores JWT, refresh automático, errores |
| MercadoPago browser | `"mercadopago react sdk"` | `foodstore-frontend` + `foodstore-domain` | SDK React, CardPayment, tokenización, flujo de pago |
| Lógica de negocio / reglas | — | `foodstore-domain` | FSM de pedidos, reglas RN-01 a RN-05, estados de pago |
| Límites de capas FSD | `"feature sliced design"` | `clean-architecture` + `foodstore-frontend` | Dirección de imports entre capas FSD, cross-imports |
| **Revisión y entrega** | | | |
| PR / commit | — | `branch-pr` | Cuando el trabajo está listo para revisión |
| Code review adversarial | — | `judgment-day` | Revisión crítica antes de archivar un change |

## Regla del contrato API
- Frontend consume contratos existentes. Nunca los inventa.
- Antes de consumir un endpoint, verificar que el change de backend está archivado en `openspec/`.
- Si falta un campo o endpoint → no improvisar, reportar al root para coordinar cross-domain.

## Google Stitch MCP — Solo referencia visual

> ⚠️ EL MCP DE STITCH NO DEBE USARSE COMO MODELO DE DATOS, ESTRUCTURA DE NEGOCIO, LÓGICA, TIPOS, SCHEMAS NI FUENTE DE ESTADO.
>
> Usalo SOLAMENTE para: inspiración visual · estilos · layout · spacing · tipografías · componentes visuales · animaciones · responsive design · jerarquía visual · experiencia de usuario
>
> NO copies: estructuras de datos · arquitectura · nombres de entidades · stores · hooks de negocio · backend · lógica · validaciones · APIs · flujos internos
>
> **El frontend YA ESTÁ TERMINADO funcionalmente. NO reemplaces lógica existente. NO rompas componentes actuales. NO hagas refactorizaciones innecesarias.**

Stitch es una herramienta de diseño AI conectada vía MCP. **Su único rol es guiar decisiones visuales.** No es una fuente de verdad de nada que no sea UI.

### Tu trabajo con Stitch es

- Adaptar el diseño visual actual para que tenga el look & feel de Stitch
- Mantener toda la funcionalidad existente sin excepción
- Conservar rutas, estados, stores y lógica sin tocarlos
- Mejorar únicamente la capa visual/UI

### Qué aplicás de Stitch

- Paleta de colores y tokens de tipografía
- Escala de espaciado y ritmo visual
- Estilo de cards, inputs, botones, badges
- Navbar, sidebar, tablas, modales
- Layout general y responsive behavior

Si existe una vista en el frontend actual que NO está en Stitch: **creala visualmente en el momento** siguiendo el mismo sistema visual. No esperés — mantenés coherencia con el resto.

### Restricciones absolutas — NUNCA usar Stitch para

- Modelos de datos, tipos TypeScript, interfaces
- Lógica de negocio o de presentación
- Stores (Zustand), queries (TanStack Query) o mutations
- Contratos de API, payloads, respuestas del backend
- Arquitectura, estructura de carpetas, imports
- Nada que no sea clases CSS/Tailwind y estructura HTML del componente

### Reglas de oro

1. **La spec gana siempre.** Si hay conflicto entre Stitch y `openspec/` → la spec gana.
2. **Zero cambios de lógica.** Si para aplicar un estilo necesitás cambiar lógica → el estilo se adapta, no la lógica.
3. **No copiar código generado por Stitch.** Adaptalo a FSD + Tailwind v3 + TypeScript strict.
4. **No tocar el backend bajo ningún concepto.**

### Cómo usarlo

1. Exportá el `DESIGN.md` del proyecto desde Stitch
2. Usalo como referencia para clases Tailwind, colores y layout
3. Aplicá los tokens visuales sobre los componentes existentes — no reescribas la lógica, solo las clases
