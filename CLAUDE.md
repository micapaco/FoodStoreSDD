# Food Store — Router Global

## Fase actual del proyecto
**Fase temprana: pre-apply. Puede haber changes en propose o diseño, pero no debe asumirse implementación cerrada.**

Reglas obligatorias en esta fase:
- Leer `docs/` antes de cualquier acción
- No asumir que existe código implementado ni que un change está cerrado
- Verificar el estado real del change antes de operar:
  - Si el change no fue propuesto → no implementar, ir a `/opsx:propose`
  - Si el change está propuesto pero no archivado → trabajo activo; revisar artefactos y estado del código antes de continuar
  - Si el change está archivado → cualquier cambio nuevo requiere evaluar un nuevo change

## Detección de dominio

### Es backend cuando la tarea afecta:
- Endpoints, routers, servicios, modelos, migraciones, seed
- Autenticación, autorización, JWT, RBAC
- Lógica de negocio, UoW, FSM, reglas de negocio
- Webhooks, integración MercadoPago (backend)

→ Leer `backend/CLAUDE.md` antes de operar.

### Es frontend cuando la tarea afecta:
- Componentes, páginas, layout, estilos
- Estado del cliente (Zustand) o del servidor (TanStack Query)
- Formularios, validación, interacción
- Consumo de API, interceptores Axios
- Integración MercadoPago en browser

→ Leer `frontend/CLAUDE.md` antes de operar.

### Es cross-domain cuando la tarea afecta backend Y frontend al mismo tiempo:
- Falta un campo en la API que el frontend necesita
- Cambia un payload o una response
- Se agrega una feature que requiere contrato nuevo
- Un flujo end-to-end cambia en ambas capas

**Cross-domain no implementa. Cross-domain coordina.**

## Coordinación cross-domain

1. Identificar exactamente qué cambia en backend y qué en frontend
2. Si cambia el contrato API → backend define primero, siempre
3. Frontend no consume contratos no definidos — si no hay contrato claro, espera
4. Si el change de backend está abierto pero el contrato ya está explicitado y acordado, frontend puede avanzar sobre ese contrato
5. Si frontend necesita un dato que no existe → no inventar el endpoint, coordinar desde aquí

## Regla del contrato API
- Backend define el contrato API. Es la fuente de verdad.
- El contrato vive en `openspec/` y en FastAPI `/docs`.
- Cambiar un contrato requiere: proponer el change en backend → definir el contrato con claridad → frontend consume cuando ese contrato está acordado.
- Frontend nunca fuerza un cambio de contrato.

## Reglas globales
- No mezclar capas: backend no asume UI, frontend no inventa endpoints
- No improvisar fuera del dominio asignado
- Specs antes que código, siempre
- Cambios cross-domain se coordinan desde este archivo

## Referencias
- Backend: `backend/CLAUDE.md`
- Frontend: `frontend/CLAUDE.md`
- Specs del proyecto: `openspec/`
- Documentación: `docs/`
- Changes planificados: `docs/CHANGES.md`
