# Backend — Food Store

## Stack
- Python + FastAPI
- SQLModel + PostgreSQL
- Alembic (migraciones)
- Passlib / bcrypt (auth)
- slowapi (rate limiting)
- mercadopago SDK (Python)
- pytest (tests backend)

## Qué hace este dominio
- Routers y endpoints REST
- Lógica de negocio (service layer, UoW)
- Modelos y persistencia (SQLModel, BaseRepository)
- Migraciones y seed data
- Autenticación y autorización (JWT, RBAC)
- Integración MercadoPago (pagos, webhooks IPN)

## Qué NO hace este dominio
- UI ni layout
- Decisiones visuales o de navegación
- Asumir cómo el frontend consume los endpoints
- Cambiar un contrato API sin coordinar con el root primero

## Qué leer primero
Antes de cualquier acción, leer en este orden:

1. `docs/Descripcion.txt`
2. `docs/Integrador.txt`
3. `docs/Historias_de_usuario.txt`
4. `docs/CHANGES.md`

No asumir que existe código implementado. Verificar el estado del change antes de operar:
- Si el change no fue propuesto → no implementar, ir a `/opsx:propose`
- Si el change está propuesto pero no archivado → trabajo activo; revisar artefactos y estado del código antes de continuar
- Si el change está archivado → cualquier cambio nuevo requiere evaluar un nuevo change

## Auto-load de skills

**Antes de escribir cualquier código de backend**, seguí estos pasos en orden:

1. **Buscá la categoría** de la tarea en la tabla de abajo
2. **Ejecutá `find-skills`** con la tecnología de la categoría para buscar skills del ecosistema (ej: `npx skills find "fastapi sqlmodel"`)
   - Si encontrás una skill relevante con buen rating → instalala y usala
   - Si no encontrás → seguí con el paso 3
3. **Cargá `clean-architecture`** — se carga SIEMPRE, en toda tarea de código, sin excepción. Contiene las reglas de capas, dirección de dependencias, controllers thin, entities puras, y boundaries. No es opcional.
4. **Cargá la skill de proyecto** indicada en la columna "Skill de proyecto" — estas tienen las convenciones específicas de Food Store
5. **Recién ahí escribí código** — con la guía de las tres capas: ecosystem (genérica) + clean-architecture (principios) + foodstore-* (convenciones del proyecto)

## Tabla de categorías

> Las skills `openspec-*` son skills del **workflow OPSX** (especificación, diseño, tasks, verificación).
> No son skills técnicas del dominio backend. Usarlas cuando el trabajo es sobre artefactos SDD, no cuando el trabajo es código Python.
>
> Las skills `foodstore-*` son skills **técnicas del proyecto**. Contienen las convenciones, patrones y reglas de Food Store extraídas de `docs/Integrador.txt`. Cargarlas SIEMPRE antes de escribir código.

| Categoría | find-skills query | Skill de proyecto | Cuándo usarla |
|---|---|---|---|
| **Workflow OPSX** | | | |
| Diseño de un change | — | `openspec-design` | Diseñar el approach técnico de un change |
| Escritura de specs | — | `openspec-spec` | Documentar contratos, entidades, reglas |
| Desglose en tasks | — | `openspec-tasks` | Convertir un change en checklist implementable |
| Verificar implementación | — | `openspec-verify` | Validar que el código cumple las specs |
| **Dominio técnico backend** | | | |
| Endpoints / routers | `"fastapi router endpoints"` | `foodstore-backend` | Implementar routers FastAPI, status codes, response_model |
| Lógica de negocio | `"python service layer"` | `foodstore-backend` + `foodstore-domain` | Services, UoW, reglas de negocio RN-01 a RN-05, FSM |
| Modelos / ORM | `"sqlmodel postgresql"` | `foodstore-backend` + `foodstore-domain` | SQLModel, relaciones, constraints, soft delete, ERD v5 |
| Schemas Pydantic | `"pydantic v2 schemas"` | `foodstore-backend` | Create/Update/Read separados, validaciones |
| Migraciones | `"alembic migrations"` | `foodstore-backend` | Alembic, scripts DDL, seed data |
| Auth / JWT / RBAC | `"fastapi jwt auth"` | `foodstore-backend` + `foodstore-domain` | Tokens, refresh, roles, dependencias FastAPI |
| MercadoPago backend | `"mercadopago python sdk"` | `foodstore-backend` + `foodstore-domain` | SDK Python, idempotency_key, webhook IPN |
| Tests | `"pytest fastapi testing"` | `foodstore-backend` | pytest, fixtures, cobertura |
| Arquitectura / capas | `"clean architecture python"` | `clean-architecture` + `foodstore-backend` | Estructura de capas, dirección de dependencias |
| Diseño de entidades | `"domain driven design"` | `clean-architecture` + `foodstore-domain` | Modelar reglas de negocio, aislar use cases |
| Refactoring | `"python refactoring"` | `clean-architecture` | Violaciones de capas o acoplamientos |
| **Revisión y entrega** | | | |
| PR / commit | — | `branch-pr` | Cuando el trabajo está listo para revisión |
| Code review adversarial | — | `judgment-day` | Revisión crítica antes de archivar un change |

## Regla del contrato API
- Backend define el contrato. Nunca lo recibe del frontend.
- Si cambia un endpoint, payload o response → coordinar con el root antes de implementar.
- El contrato vive en los specs de `openspec/` y en FastAPI `/docs`.
- La confirmacion de pagos offline (`EFECTIVO`/`TRANSFERENCIA`) solo se implementa bajo el change `offline-payment-order-flow`; no reutilizar la transicion generica a `CONFIRMADO` fuera de ese contrato.
- El flujo de retiro en local (`direccion_id=NULL`) y sus reglas diferenciales de costo/transiciones solo se ajustan bajo el change `pickup-fulfillment-flow`; no aplicar excepciones ad hoc fuera de ese contrato.
- La asignacion operativa combinada `STOCK+PEDIDOS` es un contrato vigente de administracion de usuarios; backend acepta `["STOCK", "PEDIDOS"]` como combinacion valida y rechaza mezclas no acordadas.
