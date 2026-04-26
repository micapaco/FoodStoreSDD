# Backend — Food Store

## Stack
- Python + FastAPI
- SQLModel + PostgreSQL
- Alembic (migraciones)
- Passlib / bcrypt (auth)
- slowapi (rate limiting)
- mercadopago SDK (Python)

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

## Tabla de categorías

> Las skills `openspec-*` son skills del **workflow OPSX** (especificación, diseño, tasks, verificación).
> No son skills técnicas del dominio backend. Usarlas cuando el trabajo es sobre artefactos SDD, no cuando el trabajo es código Python.

| Categoría | Skill preferida | Fallback | Cuándo usarla |
|---|---|---|---|
| **Workflow OPSX** | | | |
| Diseño de un change | `openspec-design` | — | Diseñar el approach técnico de un change |
| Escritura de specs | `openspec-spec` | — | Documentar contratos, entidades, reglas |
| Desglose en tasks | `openspec-tasks` | — | Convertir un change en checklist implementable |
| Verificar implementación | `openspec-verify` | — | Validar que el código cumple las specs |
| **Dominio técnico backend** | | | |
| Arquitectura / capas / boundaries | `clean-architecture` | — | Diseñar o revisar la estructura de capas, dirección de dependencias, separación de responsabilidades |
| Diseño de entidades / use cases | `clean-architecture` | — | Modelar reglas de negocio, aislar use cases, definir puertos y límites |
| Refactoring arquitectónico | `clean-architecture` | — | Detectar y corregir violaciones de capas o acoplamientos indebidos |
| Endpoints / routers | — | `find-skills` | Implementación concreta de routers FastAPI |
| Lógica de negocio | — | `find-skills` | Services, UoW, reglas de negocio, FSM |
| Modelos / ORM | — | `find-skills` | SQLModel, relaciones, constraints, soft delete |
| Migraciones | — | `find-skills` | Alembic, scripts DDL |
| Auth / JWT / RBAC | — | `find-skills` | Tokens, refresh, roles, dependencias FastAPI |
| Tests | — | `find-skills` | pytest, fixtures, cobertura |
| **Revisión y entrega** | | | |
| PR / commit | `branch-pr` | — | Cuando el trabajo está listo para revisión |
| Code review adversarial | `judgment-day` | — | Revisión crítica antes de archivar un change |

## Regla del contrato API
- Backend define el contrato. Nunca lo recibe del frontend.
- Si cambia un endpoint, payload o response → coordinar con el root antes de implementar.
- El contrato vive en los specs de `openspec/` y en FastAPI `/docs`.
