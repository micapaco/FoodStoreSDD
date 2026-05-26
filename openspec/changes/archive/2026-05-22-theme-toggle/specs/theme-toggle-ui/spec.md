## ADDED Requirements

### Requirement: ThemeToggle persists user preference in localStorage

The system SHALL provide a `<ThemeToggle>` component that allows the user to switch between light and dark themes, storing the selection in `localStorage` under the key `theme`.

#### Scenario: Toggle switches to dark mode

- **WHEN** the current theme is light and the user clicks `<ThemeToggle>`
- **THEN** the `light` class is removed from `document.documentElement`
- **THEN** `localStorage.setItem('theme', 'dark')` is called
- **THEN** the toggle button reflects the dark theme state (e.g. moon icon or "Oscuro" label)

#### Scenario: Toggle switches to light mode

- **WHEN** the current theme is dark and the user clicks `<ThemeToggle>`
- **THEN** the `light` class is added to `document.documentElement`
- **THEN** `localStorage.setItem('theme', 'light')` is called
- **THEN** the toggle button reflects the light theme state (e.g. sun icon or "Claro" label)

#### Scenario: Preference survives page reload

- **WHEN** the user selected dark mode in a previous session
- **THEN** on the next page load the `dark` class is present on `<html>` before React hydrates
- **THEN** no flash of the opposite theme occurs (FOUC prevention)

#### Scenario: Default theme is dark for public routes, light for private routes

- **WHEN** no `theme` key exists in `localStorage` and the user is on a public route
- **THEN** the page loads in dark mode (no `light` class on `<html>`)

#### Scenario: Default theme is light for private routes when no preference stored

- **WHEN** no `theme` key exists in `localStorage` and `PrivateLayout` mounts
- **THEN** the `light` class is added to `<html>` by `PrivateLayout` on mount

---

### Requirement: useTheme hook exposes theme state and toggle function

The system SHALL provide a `useTheme` hook at `src/shared/hooks/useTheme.ts` that synchronizes React state with the DOM class and `localStorage`.

#### Scenario: Hook reads initial state from DOM

- **WHEN** `useTheme()` is called on mount
- **THEN** `isLight` reflects whether `document.documentElement.classList.contains('light')`

#### Scenario: toggleTheme updates DOM and storage atomically

- **WHEN** `toggleTheme()` is called from `useTheme()`
- **THEN** the DOM class and `localStorage` are updated in the same synchronous operation
- **THEN** the React `isLight` state is updated to match
