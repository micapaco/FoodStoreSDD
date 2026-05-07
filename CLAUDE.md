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

## Convenciones globales

### Naming
- Python: `snake_case` (variables, funciones, módulos), `PascalCase` (clases)
- TypeScript: `camelCase` (variables, funciones), `PascalCase` (componentes, interfaces)
- Base de datos: `snake_case`
- API: `/api/v1/recurso` con sustantivos plurales

### Commits
```
feat(modulo): descripción del cambio
fix(modulo): descripción del bug corregido
refactor(modulo): descripción del refactor
test(modulo): descripción de los tests
docs(modulo): descripción del cambio en docs
```
No agregar Co-Authored-By ni atribución de AI. Solo conventional commits.

### Calidad de código
- Funciones < 50 líneas, responsabilidad única (SRP)
- Docstrings en funciones públicas (Python), JSDoc en funciones públicas (TypeScript)
- No dejar TODOs sin contexto — si hay un TODO, debe decir POR QUÉ

## Estructura del proyecto

```
RepositorioBaseFoodStore-SDD/
├── backend/
│   ├── app/
│   │   ├── core/           # Infraestructura: config, errors, middleware, rate_limit
│   │   ├── api/v1/         # Routers REST bajo /api/v1
│   │   └── modules/        # Módulos feature-first (auth, productos, pedidos, etc.)
│   ├── requirements.txt
│   └── .env / .env.example
├── frontend/               # React + TypeScript + Vite (por implementar)
├── docs/                   # Specs del sistema (fuente de verdad)
│   ├── Integrador.txt      # Arquitectura, ERD v5, API, patrones, rúbrica
│   ├── Descripcion.txt     # Visión general, actores, stack
│   ├── Historias_de_usuario.txt  # US-000 a US-076
│   └── CHANGES.md          # Mapa de 19 changes con dependencias
├── openspec/               # Artefactos SDD (changes, specs archivadas)
├── .agents/skills/         # Skills de proyecto
└── .atl/skill-registry.md  # Registro de skills para delegación
```

## Skills de dominio

El sistema de skills tiene **tres capas** que se cargan en orden antes de escribir código:

### 1. `find-skills` — Skills del ecosistema (genéricas)
Ejecutar `find-skills` (`npx skills find "<tecnología>"`) para buscar skills de buenas prácticas de la tecnología en el ecosistema público (skills.sh). Si se encuentra una skill relevante con buen rating, instalarla y usarla.

### 2. `clean-architecture` — Principios arquitectónicos (SIEMPRE)
Se carga **en toda tarea de código, sin excepción**. No es opcional. Contiene las 42 reglas de Clean Architecture: dirección de dependencias, entities puras, controllers thin, framework isolation, boundary definition. Aplica a backend Y frontend.

### 3. `foodstore-*` — Skills de proyecto (convenciones Food Store)
Contienen las convenciones específicas de Food Store extraídas de `docs/Integrador.txt`. Se cargan SIEMPRE además de las anteriores.

| Skill | Contenido | Usar cuando |
|-------|-----------|-------------|
| `foodstore-backend` | Capas, módulos, UoW, BaseRepo, schemas, HTTP, auth, seed | Cualquier tarea backend |
| `foodstore-frontend` | FSD, Zustand stores, TanStack Query, TS, UX patterns | Cualquier tarea frontend |
| `foodstore-domain` | ERD v5, FSM, RN-01 a RN-05, pagos MP, rúbrica, naming | Cross-domain o decisiones de arquitectura |

**Flujo correcto**: `find-skills` (best practices genéricas) → `clean-architecture` (principios) → `foodstore-*` (convenciones del proyecto) → codear.

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
