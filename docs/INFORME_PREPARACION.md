# Informe de avance — preparación arquitectónica del proyecto

## 1. Estado real del proyecto al arrancar

### Qué verificamos
Revisamos:

- `README.md`
- `docs/Descripcion.txt`
- `docs/Integrador.txt`
- `docs/Historias_de_usuario.txt`
- `docs/CHANGES.md`

### Conclusión
El proyecto está en una etapa **spec-first**:

- todavía **no hay implementación real** en `backend/` ni `frontend/`
- la fuente de verdad actual está en `docs/`
- el trabajo real por ahora es:
  - ordenar arquitectura
  - definir flujo
  - preparar `CLAUDE.md`
  - dejar listo el terreno para `propose`

### Decisión
**Tratar el repo como proyecto pre-implementación.**

### Justificación
No tenía sentido diseñar reglas como si ya existiera código complejo, porque todavía no arrancó el desarrollo real.

---

## 2. Decisión de arquitectura de agentes por dominio

### Qué definimos
Se aprobó la idea de trabajar con **agentes separados por dominio**:

- backend
- frontend

Y con **routing centralizado** desde un `CLAUDE.md` raíz.

### Estructura decidida
- `CLAUDE.md` → router global
- `backend/CLAUDE.md` → reglas backend
- `frontend/CLAUDE.md` → reglas frontend

### Justificación
Esto encaja con la arquitectura del proyecto:

- backend con FastAPI, SQLModel, Alembic, UoW, FSM, auth, MercadoPago
- frontend con React, TypeScript, Vite, Zustand, TanStack Query/Form, Tailwind

Separar dominios evita mezclar responsabilidades y mejora el foco del agente.

---

## 3. Decisión sobre cross-domain

### Qué definimos
`cross-domain` **no es un dominio aparte** ni una carpeta propia.

Vive en el **`CLAUDE.md` raíz** como lógica de coordinación.

### Qué significa
Un cambio es cross-domain cuando afecta backend y frontend al mismo tiempo, por ejemplo:

- falta un campo en la API
- cambia un payload
- una feature requiere contrato nuevo
- cambia un flujo end-to-end

### Justificación
No queríamos sobreingeniería.

Crear un `cross-domain/CLAUDE.md` hubiera tratado a cross-domain como otro dominio técnico, cuando en realidad es una **política de orquestación**.

---

## 4. Decisión sobre contrato API

### Qué definimos
Regla central del sistema:

- **backend define el contrato API**
- **frontend lo consume**
- **frontend no inventa endpoints**
- **backend no asume UI**

### Justificación
Esta fue una de las decisiones más importantes porque protege la integración del proyecto.

Sin esa regla pasa lo clásico:

- frontend inventa payloads
- backend responde otra cosa
- se rompe la coordinación

---

## 5. Decisión sobre workflow OPSX / SDD

### Qué verificamos
Del `README.md` y `docs/CHANGES.md` confirmamos que el flujo esperado del proyecto es:

- `explore`
- `propose`
- `apply`
- `archive`

Y además hay una regla explícita:

> sin `proposal.md` y `design.md` aprobados, no hay `apply`

### Decisión
**Antes de `apply`, tiene que existir `propose`.**

### Justificación
Aunque OPSX se describa como “fluido”, este repo tiene una guardia concreta: no se implementa sin artefactos previos.

---

## 6. Refinamiento del significado de “estado del change”

### Problema encontrado
Había ambigüedad en esta regla:

> “si no pasó por propose, priorizar especificación antes que código”

Eso no alcanzaba para explicar qué pasa si:

- ya existe código
- ya pasó por `propose`
- pero todavía no está archivado

### Solución conceptual
Definimos tres estados:

#### A. No propuesto
- no se implementa
- primero specs

#### B. Propuesto pero no archivado
- el change sigue activo
- hay que revisar artefactos + revisar código + continuar/corregir

#### C. Archivado
- ese change ya se considera cerrado
- cualquier cambio nuevo debe evaluarse como otro change

### Justificación
Esto aclara el flujo real y evita una lectura binaria demasiado simplista.

---

## 7. Problema con skills: confusión entre categorías y skills reales

### Problema encontrado
Aparecieron ideas como:

- `api_design`
- `service_layer`
- `db_models`
- `ui_components`
- `forms`

Pero esas no eran skills instaladas reales.

### Decisión
Separar dos cosas:

#### Categorías de routing
Ejemplos:
- endpoints
- auth
- ui
- forms
- state

#### Skills reales
Solo las que de verdad existen instaladas.

### Justificación
No queríamos escribir `CLAUDE.md` “de cartón”, con nombres lindos pero inexistentes.

---

## 8. Instalación y verificación de `find-skills`

### Qué pasó
Primero hubo dudas sobre si instalarla:

- en backend
- en frontend
- o en raíz

### Decisión
**Una sola instalación a nivel proyecto, desde la raíz.**

### Justificación
Es un monorepo. No tiene sentido duplicar la instalación por carpeta si el root va a orquestar.

---

## 9. Problema con la instalación de skills

### Problema encontrado
Cuando instalaste `find-skills`, el sistema creó:

- `.claude/`
- `.agents/`
- `skills-lock.json`

Vos querías algo más “CLAUDE-only”.

### Qué verificamos
Vimos que:

- `.agents/skills/find-skills` tenía el contenido real
- `.claude/skills/find-skills` era un enlace/junction

### Decisión
**No borrar solo `.agents` ni solo `.claude`.**
Dejar la instalación como está.

### Justificación
Borrar una sola parte dejaba la instalación inconsistente:

- si borrabas `.agents`, rompías la fuente real
- si borrabas `.claude`, Claude dejaba de verla

### Problema resuelto
Se estabilizó la instalación actual en lugar de romperla por limpieza parcial.

---

## 10. Decisión sobre skills globales

### Problema encontrado
Apareció la duda:

- ¿conviene borrar las skills globales?

### Decisión
**No borrarlas por ahora.**

### Justificación
Todavía no están ejecutando trabajo real de código.
El problema urgente no era limpiar el entorno global, sino ordenar el sistema de coordinación del proyecto.

---

## 11. Instalación de `clean-architecture`

### Qué pasó
Se pidió una skill tipo “clean architecture”.
Primero hubo duda sobre si era:

- un MCP
- o una skill

### Qué verificamos
Confirmamos que **no es un MCP**, sino una **skill**.

Además encontramos varias opciones y recomendamos:

- `pproenca/dot-skills/clean-architecture`

### Justificación
Era la más general, más orientada a reglas arquitectónicas limpias y más útil para este proyecto que una opción sesgada a stacks específicos.

### Resultado
La skill quedó instalada correctamente y verificamos que aparece en:

- `.claude/skills/clean-architecture`
- `.agents/skills/clean-architecture`
- `skills-lock.json`

---

## 12. Decisión sobre cuándo actualizar los `CLAUDE.md`

### Problema encontrado
Surgió la duda:

> “¿hay que cambiar los `CLAUDE.md` cada vez que instalo una skill?”

### Decisión
**No.**
Solo cuando una skill nueva cambia de verdad:

- el routing
- la prioridad
- el comportamiento esperado del agente
- o se vuelve skill preferida para una categoría importante

### Justificación
No queríamos que `CLAUDE.md` se convierta en un catálogo infinito de skills instaladas.

---

## 13. Revisión de los tres `CLAUDE.md`

### Qué revisamos
Leímos:

- `CLAUDE.md`
- `backend/CLAUDE.md`
- `frontend/CLAUDE.md`

### Conclusión
La base está **bien**, pero detectamos ajustes pendientes.

### Problemas detectados
1. El root quedó desactualizado diciendo:
   - `Pre-código. Pre-propose.`
2. La regla:
   - “frontend no empieza hasta que backend archive”
   era demasiado rígida
3. Faltaba formalizar mejor el estado:
   - propuesto pero no archivado

### Solución conceptual
Quedó claro que hay que ajustar esos archivos, especialmente el root.

---

## 14. Reescritura de `docs/CHANGES.md`

### Qué hicimos
Reescribí `docs/CHANGES.md` completo.

### Problema encontrado
El mapa anterior tenía buena dirección general, pero:

- mezclaba demasiadas responsabilidades
- ocultaba épicas reales
- tenía megachanges poco prácticos para OPSX

### Cambios clave
Pasamos a un mapa de **19 changes** más finos y mejor alineados con las historias reales.

#### Nuevos bloques explícitos
- `frontend-shell`
- `profile`
- `checkout-validation`
- `order-feedback`
- `admin-users`
- `admin-metrics`
- `system-config`

#### También se separó
- `infra-backend-core`
- `infra-database`

### Justificación
Esto hace el trabajo más:

- proponible
- diseñable
- revisable
- aplicable

sin monstruos innecesarios.

---

## 15. Estado actual después de todo esto

### Qué ya está resuelto
- contexto real del proyecto entendido
- flujo OPSX entendido
- regla del contrato API definida
- separación backend/frontend definida
- cross-domain ubicado correctamente
- `find-skills` instalada y estabilizada
- `clean-architecture` instalada y verificada
- mapa de changes reescrito
- base de los 3 `CLAUDE.md` creada

### Qué todavía falta
- ajustar los `CLAUDE.md` para reflejar:
  - fase real del proyecto
  - estado intermedio “propuesto pero no archivado”
  - uso de `clean-architecture` como skill real relevante
  - una regla cross-domain menos rígida

---

# Problemas que enfrentamos y cómo los resolvimos

## Problema 1
Confusión entre estado del proyecto y estado de los changes.

### Solución
Definimos:
- no propuesto
- propuesto no archivado
- archivado

---

## Problema 2
Confusión entre categorías de skills y skills reales.

### Solución
Separar:
- etiquetas de routing
- skills instaladas reales

---

## Problema 3
Instalación de skills dejó `.claude` y `.agents`.

### Solución
Verificamos dependencias y decidimos no romper la instalación parcial.

---

## Problema 4
No estaba claro dónde vive cross-domain.

### Solución
Lo ubicamos en el `CLAUDE.md` raíz.

---

## Problema 5
El mapa de changes no estaba suficientemente alineado con las historias.

### Solución
Reescritura completa de `docs/CHANGES.md`.

---

# Próximo paso recomendado

El próximo paso más lógico es:

## ajustar los 3 `CLAUDE.md`
especialmente:
- root
- backend
- frontend

para que queden alineados con todo lo que ya decidimos.

---

# Change 01 — `infra-backend-core`

## ¿El apply fue el esperado?

**Sí, con matices.** El código estaba todo implementado al momento de verificar. Todos los módulos existían y el comportamiento era el correcto. Sin embargo, al momento de intentar levantar el servidor por primera vez aparecieron tres problemas que no estaban previstos.

---

## Qué se hizo

- Verificamos el apply contra el propose y el tasks.md — 44 tareas, todas cubiertas por el código.
- Levantamos el servidor y ejecutamos los smoke tests (9.1, 9.2, 9.3).
- Recorrimos los 6 specs (10.1–10.6) y ejecutamos `openspec validate`.
- Corregimos dos gaps entre la spec y la implementación.
- Creamos `backend/README.md`.
- Archivamos el change — specs sincronizadas a `openspec/specs/`.

---

## Complicaciones

### Complicación 1 — `CORS_ORIGINS` y pydantic-settings v2

**Qué pasó:** Al levantar el servidor, `uvicorn` caía con `SettingsError: error parsing value for field "CORS_ORIGINS"`.

**Causa raíz:** `pydantic-settings` v2 intenta JSON-decodificar los campos declarados como `list[str]` antes de que corran los `field_validator`. El valor `http://localhost:5173` (CSV) no es JSON válido, así que el error ocurría antes de llegar al validador custom que sí sabía parsearlo.

**Solución:** Se declaró `CORS_ORIGINS` como `str` para evitar el pre-parseo, y se expuso el valor ya parseado como `list[str]` vía un `@computed_field` llamado `cors_origins`. Se actualizó `main.py` para usar `settings.cors_origins` y se corrigió el scenario correspondiente en el spec.

**Lección:** En pydantic-settings v2, para campos complejos (`list`, `dict`) que necesitan parsing custom desde variables de entorno, declarar el campo como `str` y parsear con un `@computed_field`.

---

### Complicación 2 — `RATE_LIMIT_DEFAULT` y `RATE_LIMIT_STORAGE_URI` no cableados

**Qué pasó:** Al recorrer los specs de `backend-rate-limiting`, se detectó que ambas variables existían en `Settings` pero no estaban conectadas al `Limiter` de slowapi. El Limiter se creaba sin `default_limits` ni `storage_uri`, por lo que esas settings eran decorativas.

**Causa raíz:** El tasks.md decía explícitamente "sin `default_limits`" (para evitar 429 durante el desarrollo), pero la spec sí exigía que el default fuera aplicable. Además nadie cableó el `storage_uri`.

**Solución:** Se reescribió la inicialización del Limiter en `rate_limit.py` con una función `_create_limiter()` que lee `get_settings()` al importar el módulo y pasa `default_limits=[settings.RATE_LIMIT_DEFAULT]` y `storage_uri=settings.RATE_LIMIT_STORAGE_URI` (si está definido).

**Lección:** Cuando una setting existe pero no se usa en ningún lado, es un gap. Conviene hacer un check explícito al final del apply: "¿cada campo de Settings está siendo consumido por alguien?"

---

### Complicación 3 — Puerto ocupado al levantar el servidor en background

**Qué pasó:** Al correr `uvicorn` en procesos de background desde el agente, varios intentos consecutivos dejaban el puerto 8000 o 8001 ocupado, lo que impedía arrancar una nueva instancia.

**Causa raíz:** Los procesos de bash en background no liberan el puerto automáticamente al terminar en entornos Windows con Git Bash.

**Solución:** Se mató el proceso ocupando el puerto con `taskkill` antes de cada intento nuevo, o se cambió de puerto. Los smoke tests finales se corrieron todos en un solo comando bash para evitar el problema.

**Lección:** Para smoke tests en Windows desde el agente, agrupar todos los curls en un único comando junto con el arranque del servidor, en lugar de levantar en background y testear por separado.

---

## MCPs y skills utilizados

### MCPs
| MCP | Herramientas usadas | Para qué |
|---|---|---|
| `engram` | `mem_context`, `mem_save`, `mem_session_summary`, `mem_search` | Memoria persistente entre sesiones — guardar decisiones, bugs y descubrimientos del change |

### Skills instaladas antes del apply
Estas skills se instalaron durante la fase de preparación (antes del apply) y quedaron disponibles para el trabajo del change y los siguientes:

| Skill | Cuándo se instaló | Para qué |
|---|---|---|
| `find-skills` | Fase de preparación | Descubrir y resolver skills disponibles para el proyecto |
| `clean-architecture` | Fase de preparación | Diseñar y revisar capas, dependencias y separación de responsabilidades en el backend |

### Skills invocadas durante el trabajo del change
| Skill | Estado | Para qué |
|---|---|---|
| `openspec-verify` | Cargada por error, no ejecutada | Se disparó al intentar archivar; se fue directo al `openspec archive` porque la verificación ya se había hecho manualmente |

> `clean-architecture` y `find-skills` estaban instaladas pero no se invocaron explícitamente durante la verificación del change 01 — el apply ya estaba hecho y el trabajo fue revisar, corregir gaps y cerrar.

### CLI de openspec usado directamente
| Comando | Para qué |
|---|---|
| `openspec list --json` | Ver el estado de los changes activos |
| `openspec status --change "infra-backend-core" --json` | Ver artefactos y tareas del change |
| `openspec validate infra-backend-core` | Validar que los artefactos del change son coherentes |
| `openspec archive infra-backend-core` | Cerrar el change y sincronizar specs a `openspec/specs/` |

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
