## ADDED Requirements

### Requirement: Layout initializes theme before React hydrates

The system SHALL include an inline `<script>` in `public/index.html` (before the React root script) that reads `localStorage.getItem('theme')` and conditionally adds the `dark` class to `document.documentElement`.

#### Scenario: Inline script applies dark class on load

- **WHEN** the browser parses `index.html` and `localStorage.theme === 'light'`
- **THEN** `document.documentElement.classList.add('light')` executes synchronously before any React render
- **THEN** no flash of dark theme occurs on private route reload

#### Scenario: Inline script is a no-op when preference is dark or absent

- **WHEN** the browser parses `index.html` and `localStorage.theme` is `'dark'` or absent
- **THEN** no class is added to `document.documentElement`
- **THEN** the page renders in dark mode (global default)

---

### Requirement: PrivateLayout manages light class lifecycle

The system SHALL have `PrivateLayout` add the `light` class to `<html>` on mount and remove it on unmount, so public routes remain dark and private routes default to light.

#### Scenario: Entering private routes applies light theme

- **WHEN** `PrivateLayout` mounts and `localStorage.theme !== 'dark'`
- **THEN** the `light` class is added to `document.documentElement`

#### Scenario: Leaving private routes restores dark theme

- **WHEN** `PrivateLayout` unmounts (user navigates to public route or logs out)
- **THEN** the `light` class is removed from `document.documentElement`

---

### Requirement: ThemeToggle visible only in admin/staff views

The system SHALL render `<ThemeToggle>` in `<PrivateHeader>` only when the user is NOT in client view (i.e., `canUseCart` is false).

#### Scenario: ThemeToggle visible for admin roles

- **WHEN** an authenticated ADMIN/STOCK/PEDIDOS user views a private route
- **THEN** `<ThemeToggle>` is rendered within `<PrivateHeader>`

#### Scenario: ThemeToggle hidden for client view

- **WHEN** a CLIENT (or ADMIN in client view path) views the store
- **THEN** `<ThemeToggle>` is NOT rendered
