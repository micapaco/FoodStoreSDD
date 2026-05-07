# Informe de avance — Food Store SDD

Este informe documenta las decisiones de arquitectura, el trabajo realizado en el Change 01 y las correcciones aplicadas en la sesión de verificación.

---

# Parte 1 — Preparación del proyecto

Antes de escribir una sola línea de código, hubo una sesión completa de preparación para definir cómo iba a funcionar el sistema de agentes y el flujo de trabajo.

## Estado del proyecto al arrancar

Al revisar el repo, confirmamos que el proyecto estaba en etapa **spec-first**: no había implementación real en `backend/` ni en `frontend/`. La fuente de verdad era `docs/`. Por eso tratamos el repo como **pre-implementación** — no tenía sentido diseñar reglas para código que no existía.

---

## Decisiones de arquitectura tomadas

### 1. Agentes separados por dominio

Se definió trabajar con agentes especializados por dominio, con routing centralizado:

| Archivo | Rol |
|---|---|
| `CLAUDE.md` | Router global — detecta si la tarea es backend, frontend o cross-domain |
| `backend/CLAUDE.md` | Reglas, stack y skills del dominio backend |
| `frontend/CLAUDE.md` | Reglas, stack y skills del dominio frontend |

Separar dominios evita que un agente de backend tome decisiones de UI, y viceversa.

### 2. Cross-domain no es un dominio

Un cambio es **cross-domain** cuando afecta backend y frontend al mismo tiempo (por ejemplo: cambia un payload, falta un campo en la API, o se agrega un endpoint nuevo). En esos casos el `CLAUDE.md` raíz coordina — no implementa.

No se creó una carpeta `cross-domain/` porque eso hubiera convertido una política de orquestación en un dominio técnico más, lo cual era sobreingeniería.

### 3. Regla del contrato API

Regla central del sistema:

- **Backend define el contrato API** — es la fuente de verdad
- **Frontend lo consume** — nunca lo inventa
- Si frontend necesita un dato que no existe → coordinar desde el root, no improvisar

Sin esta regla pasa lo clásico: frontend inventa payloads, backend responde otra cosa, la integración se rompe.

### 4. Flujo de trabajo OPSX

El proyecto usa el flujo **OPSX / SDD**:

```
explore → propose → apply → archive
```

Regla obligatoria: **sin `proposal.md` y `design.md` aprobados, no hay `apply`**. El flujo es fluido (se puede volver a cualquier paso), pero no se implementa sin artefactos previos.

Cada change puede estar en uno de tres estados:

| Estado | Qué significa | Qué hacer |
|---|---|---|
| No propuesto | No hay artefactos todavía | Ir a `/opsx:propose` antes de cualquier otra cosa |
| Propuesto, no archivado | Trabajo activo en curso | Revisar artefactos + código + continuar |
| Archivado | Change cerrado | Cualquier cambio nuevo requiere un change nuevo |

### 5. Skills instaladas

Se instalaron dos skills a nivel proyecto durante la preparación:

| Skill | Para qué |
|---|---|
| `find-skills` | Descubrir e instalar nuevas skills desde el ecosistema |
| `clean-architecture` | Revisar capas, dirección de dependencias y separación de responsabilidades |

**Nota sobre la instalación:** al instalar skills con `npx skills`, el sistema crea dos carpetas: `.agents/skills/` (fuente real) y `.claude/skills/` (enlace). No hay que tocar ninguna de las dos por separado — borrar una rompe la instalación.

**Regla sobre cuándo actualizar `CLAUDE.md`:** no hace falta actualizar el CLAUDE.md cada vez que se instala una skill. Solo cuando esa skill cambia el routing, la prioridad o el comportamiento esperado del agente.

### 6. Mapa de changes

Se reescribió `docs/CHANGES.md` completo. El mapa anterior tenía megachanges poco prácticos. El nuevo mapa tiene **19 changes** más finos, mejor alineados con las historias de usuario y más fáciles de proponer, diseñar y aplicar.

---

# Parte 2 — Change 01: `infra-backend-core`

## Qué incluía este change

El change 01 implementó la infraestructura base del backend:

- Configuración de la app (`Settings`, variables de entorno)
- Logging estructurado
- CORS
- Rate limiting (slowapi)
- Middleware de límite de tamaño de payload
- Manejo de errores RFC 7807 (`application/problem+json`)
- Health check endpoint
- Estructura de routers

## Resultado del apply

**El apply fue exitoso**, pero con matices. Cuando fuimos a verificar y levantar el servidor por primera vez, aparecieron tres problemas que no estaban previstos.

---

## Complicaciones y cómo se resolvieron

### Complicación 1 — `CORS_ORIGINS` no arrancaba

**Qué pasó:** Al levantar el servidor, caía con `SettingsError: error parsing value for field "CORS_ORIGINS"`.

**Por qué:** `pydantic-settings` v2 intenta parsear los campos `list[str]` como JSON antes de que corran los validadores custom. El valor `http://localhost:5173` (formato CSV) no es JSON válido, así que el error ocurría antes de llegar al validador.

**Solución:** Declarar `CORS_ORIGINS` como `str` en Settings y exponer el valor ya parseado como `list[str]` mediante un `@computed_field`. `main.py` pasó a usar `settings.cors_origins` en vez de `settings.CORS_ORIGINS`.

**Lección:** En pydantic-settings v2, si un campo necesita parsing custom desde una variable de entorno, declararlo como `str` y parsear con `@computed_field`.

---

### Complicación 2 — Rate limiting no estaba cableado

**Qué pasó:** Las variables `RATE_LIMIT_DEFAULT` y `RATE_LIMIT_STORAGE_URI` existían en `Settings` pero no se usaban en ningún lado. El Limiter de slowapi se creaba sin esas configuraciones — eran decorativas.

**Por qué:** El tasks.md decía "sin `default_limits`" para evitar 429 en desarrollo, pero la spec sí exigía que el default fuera aplicable.

**Solución:** Se reescribió la inicialización del Limiter con una función `_create_limiter()` que lee `get_settings()` al importar el módulo y pasa `default_limits` y `storage_uri` correctamente.

**Lección:** Al terminar un apply, conviene verificar que cada campo de `Settings` esté siendo consumido por alguien. Un campo que no se usa es un gap.

---

### Complicación 3 — Puerto ocupado en Windows

**Qué pasó:** Al correr el servidor en background desde el agente, intentos consecutivos dejaban el puerto 8000 ocupado y la siguiente instancia no podía arrancar.

**Por qué:** En Windows con Git Bash, los procesos de bash en background no liberan el puerto automáticamente al terminar.

**Solución:** Matar el proceso ocupando el puerto con `taskkill` antes de cada intento, o cambiar de puerto. Los smoke tests finales se corrieron todos en un único comando bash junto con el arranque del servidor.

**Lección:** Para smoke tests en Windows desde el agente, agrupar el arranque y todos los curls en un solo comando en lugar de levantar en background y testear por separado.

---

## Herramientas utilizadas

### MCP
| MCP | Herramientas | Para qué |
|---|---|---|
| `engram` | `mem_context`, `mem_save`, `mem_session_summary`, `mem_search` | Memoria persistente entre sesiones — guardar decisiones, bugs y descubrimientos |

### CLI de openspec
| Comando | Para qué |
|---|---|
| `openspec list --json` | Ver el estado de los changes activos |
| `openspec status --change "infra-backend-core" --json` | Ver artefactos y tareas del change |
| `openspec validate infra-backend-core` | Validar que los artefactos son coherentes |
| `openspec archive infra-backend-core` | Cerrar el change y sincronizar specs |

---

## Estado al archivar

| Ítem | Estado |
|---|---|
| Tasks completadas | 56/56 |
| `openspec validate` | OK |
| Smoke tests 9.1–9.3 | Pasados |
| Specs 10.1–10.8 | Verificadas |
| README backend | Creado |
| Change archivado | `2026-04-26-infra-backend-core` |
| Specs sincronizadas | 6 capabilities, 27 requirements |

---

# Parte 3 — Correcciones post-archive

Después de archivar el change 01, se detectaron dos tipos de problemas y se corrigieron en la misma sesión.

---

## Revisión de Clean Architecture

Se ejecutó la skill `clean-architecture` como revisión retroactiva del código implementado. Se encontraron dos violations que se corrigieron inmediatamente.

### Por qué no se ejecutó durante el apply

El apply fue generado por un agente que no tenía instrucción explícita de invocar `clean-architecture` antes de escribir código. La skill estaba instalada, pero la tabla de routing en `backend/CLAUDE.md` usaba lenguaje descriptivo ("skill preferida") en vez de lenguaje imperativo. El agente la vio como información de referencia, no como una orden.

Esto es una **deuda de proceso** — se corrigió en esta misma sesión (ver más abajo).

---

### Violation 1 — Excepciones de dominio mezcladas con infraestructura HTTP

**Qué se encontró:** Las excepciones de dominio (`AppError`, `NotFoundError`, `ConflictError`, etc.) vivían en `app/core/errors.py`, el mismo archivo que los handlers HTTP de FastAPI.

**Por qué es un problema:** Cualquier capa que necesite importar `NotFoundError` arrastra indirectamente FastAPI. El dominio no debe conocer nada de HTTP. Viola `dep-no-framework-imports`.

**Solución:** Se creó `app/core/exceptions.py` con solo la jerarquía de excepciones de dominio, sin ningún import de FastAPI ni HTTP. `errors.py` importa desde `exceptions.py`.

**Archivos afectados:**
- `backend/app/core/exceptions.py` — creado
- `backend/app/core/errors.py` — refactorizado

---

### Violation 2 — Settings resueltas dentro de un handler

**Qué se encontró:** El handler de excepciones no controladas hacía `from app.core.config import get_settings` dentro del cuerpo de la función, en cada request.

**Por qué es un problema:** La resolución de dependencias (settings, DI) debe ocurrir en el borde del sistema, en `create_app()`, no dentro de los handlers. El handler no declaraba su dependencia, la resolvía solo. Viola `frame-di-container-edge`.

**Solución:** Se reemplazó el handler por una factory `make_unhandled_handler(settings: Settings)` que recibe `Settings` como parámetro y retorna el handler como closure. `register_exception_handlers` también pasó a recibir `settings`. `create_app()` en `main.py` pasa el settings que ya tiene.

**Archivos afectados:**
- `backend/app/core/errors.py` — nueva firma de `make_unhandled_handler` y `register_exception_handlers`
- `backend/app/main.py` — `register_exception_handlers(app, settings)`

---

## Corrección del flujo de auto-load de skills

### El problema

El `backend/CLAUDE.md` y el `frontend/CLAUDE.md` tenían una tabla de skills pero con lenguaje descriptivo. El agente podía leerla y no entender que tenía que cargar la skill antes de escribir código. Eso explica por qué el apply del change 01 no invocó `clean-architecture`.

### El flujo correcto (ahora implementado)

```
CLAUDE.md (root) detecta que la tarea es de backend
        ↓
"Leer backend/CLAUDE.md antes de operar"
        ↓
backend/CLAUDE.md — sección "Auto-load de skills":
"Antes de escribir cualquier código, cargá la skill
 correspondiente. No escribas código sin haberla cargado."
        ↓
El agente identifica la categoría en la tabla
        ↓
Carga e invoca la skill (ej: clean-architecture para arquitectura)
        ↓
Recién entonces escribe código
```

### Cambios aplicados

- Se agregó la sección `## Auto-load de skills` en `backend/CLAUDE.md` y `frontend/CLAUDE.md` con instrucción imperativa.
- Se creó `.atl/skill-registry.md` con las reglas compactas de todas las skills instaladas. Esto permite que el orquestador pre-inyecte las reglas relevantes en el prompt del sub-agente antes de que empiece a trabajar.
- El registry también se guardó en engram para que sobreviva entre sesiones.

---

# Resumen de lecciones aprendidas

| Lección | Contexto |
|---|---|
| En pydantic-settings v2, declarar campos complejos como `str` + `@computed_field` | Complicación 1 — CORS_ORIGINS |
| Al terminar un apply, verificar que cada campo de Settings esté siendo consumido | Complicación 2 — rate limiting |
| En Windows, agrupar el arranque del servidor y los tests en un solo comando bash | Complicación 3 — puerto ocupado |
| Las excepciones de dominio no deben vivir en el mismo módulo que los handlers HTTP | Violation 1 — Clean Architecture |
| La resolución de settings debe ocurrir en `create_app()`, no dentro de los handlers | Violation 2 — Clean Architecture |
| Las instrucciones para agentes deben ser imperativas, no descriptivas | Flujo de auto-load de skills |
| Instalar una skill no es suficiente — hay que definir cuándo y cómo invocarla | Flujo de auto-load de skills |

---

# Parte 4 — Sistema de skills de dos capas

## El problema detectado

Al auditar los `CLAUDE.md`, descubrimos que la tabla de categorías usaba `find-skills` como **fallback** para todas las tareas técnicas (endpoints, modelos, auth, estado, etc.). Pero `find-skills` busca skills genéricas en el ecosistema público (`skills.sh`), no convenciones del proyecto.

En la práctica, el flujo era:

```
Tarea: "implementar router de auth con JWT"
→ CLAUDE.md dice: fallback find-skills
→ npx skills find "fastapi jwt"
→ No encuentra nada relevante (o encuentra algo genérico)
→ "No encontré skill, procedo directamente"
→ El agente codea sin guía del proyecto
```

El resultado: un agente que sabe usar FastAPI en general, pero no sabe que Food Store usa `Router → Service → UoW → Repository → Model`, que los schemas son Create/Update/Read separados, que el UoW hace commit automático, ni que existen 5 reglas de negocio que no puede violar.

## La solución: dos capas de skills

Se implementó un sistema de skills de **dos capas** complementarias:

### Capa 1 — `find-skills` (conocimiento genérico del ecosistema)

Antes de codear, el agente ejecuta `find-skills` con la tecnología de la tarea (ej: `npx skills find "fastapi jwt auth"`). Si encuentra una skill con buen rating en skills.sh, la instala y la usa.

**Qué aporta:** Best practices actualizadas de la tecnología. Errores comunes. Patrones recomendados por la comunidad. Cosas que cambian con cada versión y que un archivo estático no puede cubrir.

### Capa 2 — `foodstore-*` (convenciones específicas del proyecto)

Tres skills de proyecto creadas en `.agents/skills/` con las convenciones extraídas de `docs/Integrador.txt`:

| Skill | Contenido |
|-------|-----------|
| `foodstore-backend` | Capas (Router→Service→UoW→Repo→Model), estructura de módulos feature-first, UoW con context manager, BaseRepository[T], schemas Pydantic (Create/Update/Read), HTTP (RFC 7807, status codes, paginación), auth RBAC, seed data, infraestructura ya implementada |
| `foodstore-frontend` | Feature-Sliced Design con estructura de carpetas, 4 stores Zustand con reglas de persistencia, TanStack Query patterns, TypeScript strict, Axios interceptors, MercadoPago CardPayment, UX patterns obligatorios |
| `foodstore-domain` | ERD v5 completo (3 dominios), FSM con tabla de transiciones, reglas de negocio RN-01 a RN-05, flujo de pago MercadoPago, naming conventions, rúbrica de 200 puntos |

**Qué aporta:** Las reglas que no van a cambiar con una versión nueva de FastAPI. Las convenciones de ESTE proyecto. Lo que el profe va a evaluar.

## Por qué se necesitan ambas capas

La analogía es directa: es como construir una cocina industrial.

- **`find-skills`** es el manual del fabricante — "cómo instalar correctamente una mesada de acero inoxidable, mejores prácticas, normas de seguridad". Conocimiento genérico que aplica a cualquier cocina.
- **`foodstore-*`** es el plano de TU restaurante — "la mesada va contra la pared norte, conectada al sistema de agua de la fase 1, y debe soportar los 6 módulos de preparación del ERD". Sin esto, podés instalar la mesada perfecta en el lugar equivocado.

| Solo find-skills | Solo foodstore-* | Ambas juntas |
|---|---|---|
| Sabe cómo hacer JWT bien en general | Sabe que Food Store usa refresh tokens hasheados en BD | Hace JWT bien Y como lo necesita Food Store |
| Sabe best practices de Zustand | Sabe que hay 4 stores con persistencia selectiva | Implementa los 4 stores siguiendo best practices |
| Sabe qué es un UoW en general | Sabe que el Service recibe `uow` y NUNCA hace commit | Implementa el UoW correctamente y en el lugar correcto |

### El paralelo con la propia arquitectura del proyecto

El sistema de skills refleja la misma separación de responsabilidades del backend:

```
find-skills    = Framework      (FastAPI, SQLModel — conocimiento genérico)
foodstore-*    = Service Layer  (reglas de negocio de Food Store — conocimiento de dominio)
```

FastAPI sabe servir HTTP. Pero no sabe que un pedido tiene 6 estados y que `ENTREGADO` es terminal. Para eso necesitás la capa de dominio. Lo mismo aplica a las skills: la genérica sabe buenas prácticas de la tecnología, la del proyecto sabe las reglas del sistema.

## Flujo resultante

```
Tarea: "implementar router de auth con JWT"
→ CLAUDE.md dice: find-skills query "fastapi jwt auth" + skill de proyecto foodstore-backend
→ Paso 1: npx skills find "fastapi jwt auth" → instala skill si encuentra
→ Paso 2: Carga foodstore-backend + foodstore-domain
→ Paso 3: Codea con best practices genéricas + convenciones del proyecto
```

## Cambios aplicados

### Skills creadas
- `.agents/skills/foodstore-backend/SKILL.md` — 196 líneas
- `.agents/skills/foodstore-frontend/SKILL.md` — 155 líneas
- `.agents/skills/foodstore-domain/SKILL.md` — 163 líneas

### CLAUDE.md actualizados
- `CLAUDE.md` (root) — agregadas convenciones globales (naming, commits, calidad de código), estructura del proyecto, sección de skills de tres capas
- `backend/CLAUDE.md` — tabla de categorías con columna `find-skills query` y columna `Skill de proyecto`, `clean-architecture` como paso obligatorio
- `frontend/CLAUDE.md` — misma estructura de tabla con queries de búsqueda por categoría, `clean-architecture` como paso obligatorio

### Skill registry actualizado
- `.atl/skill-registry.md` — agregadas las 3 skills `foodstore-*` con triggers y compact rules

## Corrección: `clean-architecture` como skill always-on

### El problema

Al auditar las tablas de categorías, detectamos que `clean-architecture` solo se cargaba cuando la tarea era explícitamente sobre **"Arquitectura / capas"**, **"Diseño de entidades"** o **"Refactoring"**. Pero si la tarea era "implementar router de auth", el agente solo cargaba `foodstore-backend` — no `clean-architecture`.

Esto es exactamente lo que pasó en el change 01: el agente escribió código sin cargar `clean-architecture` y después hubo que corregir dos violations (excepciones de dominio mezcladas con HTTP, Settings resueltas dentro de handlers).

Las reglas de clean architecture no son solo para tareas de "arquitectura" — aplican a TODO el código:

| Regla | Aplica cuando escribís... |
|---|---|
| Controllers thin, no business logic | Un router de auth, un endpoint de productos, cualquier handler |
| Dependencies inward-only | Un service que importa un model, un repository que accede a la DB |
| Entities sin framework imports | Un modelo SQLModel que define relaciones |
| DI en el borde, no en handlers | Cualquier función que necesite Settings o dependencias |
| Separation of concerns | Literalmente todo |

### La corrección

Se promovió `clean-architecture` de "skill por categoría" a **paso obligatorio** en el flujo de auto-load. Ahora es el paso 3 en ambos CLAUDE.md:

```
Antes (dos capas):
  1. find-skills (ecosistema)
  2. foodstore-* (proyecto)
  3. Codear

Después (tres capas):
  1. find-skills (ecosistema)
  2. clean-architecture (SIEMPRE — principios)    ← NUEVO
  3. foodstore-* (proyecto)
  4. Codear
```

La instrucción es explícita e imperativa: **"se carga SIEMPRE, en toda tarea de código, sin excepción"**. No dice "preferida" ni "recomendada" — dice que no es opcional.

### Por qué tres capas y no dos

Cada capa cubre un nivel de abstracción diferente:

```
find-skills       = HOW     (cómo usar la tecnología correctamente)
clean-architecture = WHY     (por qué separar capas, por qué dependencies inward-only)
foodstore-*       = WHAT    (qué convenciones específicas aplican en este proyecto)
```

Sin el HOW, no sabés las best practices actuales de FastAPI.
Sin el WHY, metés lógica de negocio en el router porque "funciona".
Sin el WHAT, no sabés que el UoW hace commit automático en `__exit__`.

Las tres juntas producen código que es técnicamente correcto (HOW), arquitectónicamente sólido (WHY), y alineado con las specs del proyecto (WHAT).

## Lecciones de esta parte

| Lección | Contexto |
|---|---|
| Skills genéricas del ecosistema complementan pero no reemplazan las convenciones del proyecto | find-skills busca en skills.sh, no sabe las reglas de Food Store |
| El CLAUDE.md es un router, no un repositorio de conocimiento — debe rutear a las skills correctas | Separación de responsabilidades aplicada al propio sistema de agentes |
| Las convenciones del proyecto deben estar en skills dedicadas, no inline en el CLAUDE.md | Un CLAUDE.md de 300 líneas mezcla workflow con convenciones — viola SRP |
| Cada categoría técnica debe tener un query de búsqueda explícito para find-skills | Si el agente no sabe qué buscar, no busca nada |
| `clean-architecture` no es una skill "de arquitectura" — es una skill de TODO el código | Si solo se carga para tareas de refactoring, el código nuevo nace con violations |
| Las instrucciones para agentes deben ser imperativas y no dejar margen de interpretación | "Skill preferida" se ignora; "se carga SIEMPRE, sin excepción" se cumple |

