## Context

El frontend usa tokens de color semánticos en Tailwind (`bg-surface-high`, `text-ink`, etc.) definidos como hexadecimales hardcodeados en `tailwind.config.js`. También existe un bloque de CSS custom properties en `index.css` (`:root`) que define las mismas variables pero no están conectadas a Tailwind — son paralelas.

El sistema actual es 100% dark: todos los tokens apuntan a valores oscuros. No hay modo `dark:` de Tailwind activo ni mecanismo de preferencia del usuario.

## Goals / Non-Goals

**Goals:**
- Modo claro como tema por defecto (fondo blanco, texto oscuro)
- Toggle de tema con persistencia en `localStorage`
- Ningún componente existente necesita modificarse — el cambio es en los tokens, no en las clases

**Non-Goals:**
- Soporte de `prefers-color-scheme` automático (el usuario elige explícitamente)
- Rediseño de la paleta de colores
- Cambios en lógica, stores, rutas o backend

## Decisions

### D-1: CSS custom properties como puente entre temas

**Elegido:** Convertir los tokens de Tailwind a `var(--color-X)` y definir dos paletas en `index.css`: `:root` (light) y `.dark` (dark).

**Alternativa descartada:** Usar la variante `dark:` de Tailwind en cada componente (ej. `dark:bg-surface-high`). Requeriría modificar cada componente — decenas de archivos, alto riesgo de regresión.

**Resultado:** Cero cambios en componentes. Solo cambia qué valor tiene cada variable CSS según la clase `dark` en `<html>`.

### D-2: `darkMode: 'class'` en Tailwind

Activar `darkMode: 'class'` en `tailwind.config.js`. Aunque no usamos la variante `dark:` en componentes, es necesario para que Tailwind genere el CSS correcto cuando se usa `.dark` en el DOM.

### D-3: Inicialización sincrónica antes de React

La clase `dark` se aplica en un `<script>` inline en `index.html` ANTES de que React hidrate. Evita el flash of unstyled content (FOUC) — sin esto, el browser renderizaría el tema por defecto (light) un instante antes de aplicar el preferido.

```html
<script>
  const theme = localStorage.getItem('theme')
  if (theme === 'dark') document.documentElement.classList.add('dark')
</script>
```

### D-4: Hook `useTheme` como fuente de verdad del estado

Un hook `src/shared/hooks/useTheme.ts` sincroniza el estado React con el DOM y `localStorage`. El componente `ThemeToggle` lo consume. El hook no usa un store global (Zustand) — el DOM ya es el estado global real.

### D-5: Paleta light derivada de la paleta dark actual

Los tokens dark se mueven a `.dark`. Los tokens light son una paleta neutral clara que respeta la identidad visual:

| Token | Light | Dark (actual) |
|---|---|---|
| `surface.base` | `#ffffff` | `#192029` |
| `surface.high` | `#f8f9fa` | `#232a34` |
| `surface.higher` | `#f1f3f5` | `#2e353f` |
| `ink` | `#1e2533` | `#dce3f0` |
| `ink.muted` | `#6b7280` | `#d0c5af` |
| `line.subtle` | `#e5e7eb` | `#4d4635` |
| `brand` | sin cambio | sin cambio |

## Risks / Trade-offs

- **Contraste en componentes con colores hardcodeados**: si algún componente usa hex directamente en lugar del token Tailwind (ej. `style={{ background: '#192029' }}`), no se actualizará con el tema. Requiere revisión puntual.
- **`body { background-color: #0d141d }` en `index.css`**: debe cambiarse a `var(--color-surface)` para que el fondo base responda al tema.
- **FOUC en primera carga sin script inline**: mitigado por D-3.

## Migration Plan

1. Agregar script inline en `index.html` (D-3) — sin riesgo, no afecta nada existente
2. Agregar `darkMode: 'class'` a `tailwind.config.js`
3. Actualizar `index.css`: mover valores actuales a `.dark`, definir paleta light en `:root`, cambiar `body` a usar variables
4. Actualizar `tailwind.config.js`: reemplazar hexadecimales por `var(--color-X)` 
5. Crear `useTheme.ts` y `ThemeToggle.tsx`
6. Montar `ThemeToggle` en navbar/sidebar
7. Verificar manualmente que ambos temas renderizan correctamente en las rutas principales

Rollback: revertir `index.css` y `tailwind.config.js` restaura el estado previo completo.
