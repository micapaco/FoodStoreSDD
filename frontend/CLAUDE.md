# Frontend — Food Store

## Stack
- React 18 + TypeScript (strict: true)
- Vite (build tool)
- Tailwind CSS v3
- Zustand (authStore, cartStore, paymentStore, uiStore)
- TanStack Query v5 (estado del servidor)
- TanStack Form (formularios)
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

**Antes de escribir cualquier código de frontend**, identificá la categoría de la tarea en la tabla de abajo y cargá la skill correspondiente. No escribas código sin haberla cargado primero.

Si la categoría tiene skill preferida → cargala e invocala.
Si tiene solo fallback (`find-skills`) → buscá una skill específica antes de proceder.
Si no hay skill → procedé directamente.

## Tabla de categorías

> Las skills `openspec-*` son skills del **workflow OPSX** (especificación, diseño, tasks, verificación).
> No son skills técnicas del dominio frontend. Usarlas cuando el trabajo es sobre artefactos SDD, no cuando el trabajo es código React/TS.

| Categoría | Skill preferida | Fallback | Cuándo usarla |
|---|---|---|---|
| **Workflow OPSX** | | | |
| Diseño de un change | `openspec-design` | — | Diseñar el approach técnico de un change |
| Escritura de specs | `openspec-spec` | — | Documentar contratos de UI, estado, flujos |
| Desglose en tasks | `openspec-tasks` | — | Convertir un change en checklist implementable |
| Verificar implementación | `openspec-verify` | — | Validar que el código cumple las specs |
| **Dominio técnico frontend** | | | |
| Límites de capas FSD / boundaries | `clean-architecture` | — | Revisar dirección de imports entre capas FSD, detectar cross-imports indebidos |
| Componentes UI / React | — | `find-skills` | Componentes, páginas, widgets (FSD) |
| Estilos / Tailwind CSS | — | `find-skills` | Clases utilitarias, diseño responsivo, dark mode |
| Estado del cliente / Zustand | — | `find-skills` | authStore, cartStore, paymentStore, uiStore |
| Estado del servidor / TanStack Query | — | `find-skills` | useQuery, useMutation, invalidación de cache |
| Formularios / TanStack Form | — | `find-skills` | Validación, submit, campos controlados |
| Cliente HTTP / Axios | — | `find-skills` | Interceptores JWT, refresh automático, errores |
| MercadoPago browser | — | `find-skills` | SDK React, CardPayment, tokenización |
| **Revisión y entrega** | | | |
| PR / commit | `branch-pr` | — | Cuando el trabajo está listo para revisión |
| Code review adversarial | `judgment-day` | — | Revisión crítica antes de archivar un change |

## Regla del contrato API
- Frontend consume contratos existentes. Nunca los inventa.
- Antes de consumir un endpoint, verificar que el change de backend está archivado en `openspec/`.
- Si falta un campo o endpoint → no improvisar, reportar al root para coordinar cross-domain.
