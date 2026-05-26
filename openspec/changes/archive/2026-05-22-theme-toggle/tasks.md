## 1. FOUC prevention — index.html

- [x] 1.1 Agregar inline `<script>` en `frontend/index.html` antes del bundle de React que aplica `dark` en `<html>` si `localStorage.theme === 'dark'`

## 2. Tailwind — activar darkMode class

- [x] 2.1 Agregar `darkMode: 'class'` en `frontend/tailwind.config.js`
- [x] 2.2 Reemplazar todos los valores hex hardcodeados en los tokens de color de `tailwind.config.js` por referencias `var(--color-X)` (surface-base, surface-high, surface-higher, ink, ink-muted, line-subtle, brand)

## 3. CSS custom properties — paletas light y dark

- [x] 3.1 En `frontend/src/index.css`, mover los valores actuales de `:root` al selector `.dark`
- [x] 3.2 Definir los valores light en `:root` (surface.base: #ffffff, surface.high: #f8f9fa, surface.higher: #f1f3f5, ink: #1e2533, ink.muted: #6b7280, line.subtle: #e5e7eb, brand sin cambio)
- [x] 3.3 Cambiar `body { background-color: #0d141d }` a `body { background-color: var(--color-surface) }` (o token equivalente)

## 4. Hook useTheme

- [x] 4.1 Crear `frontend/src/shared/hooks/useTheme.ts` con `isDark: boolean` y `toggleTheme: () => void` — sincroniza DOM class y `localStorage` sin Zustand

## 5. Componente ThemeToggle

- [x] 5.1 Crear `frontend/src/shared/components/ThemeToggle.tsx` que consuma `useTheme` y renderice un botón sun/moon con `title` accesible

## 6. Montaje en layout

- [x] 6.1 Importar y renderizar `<ThemeToggle>` dentro de `<PrivateHeader>` en la posición correcta (junto al nombre de usuario o al logout)

## 7. Verificación manual

- [x] 7.1 Verificar tema light por defecto en primera carga (sin `localStorage`)
- [x] 7.2 Verificar que el toggle cambia entre temas sin flash ni parpadeo
- [x] 7.3 Verificar que la preferencia sobrevive recarga de página
- [x] 7.4 Verificar que ningún componente existente se rompe en modo light (revisar rutas principales: `/`, `/carrito`, `/admin`, `/cocina`)
- [x] 7.5 Verificar que el modo oscuro sigue viéndose correcto (igual que antes)
