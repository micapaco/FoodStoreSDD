# Profile Frontend

## Requirement: View profile page
The system SHALL display the authenticated user's profile information on the `/perfil` page.

### Scenario: Profile page shows user data
- **WHEN** an authenticated CLIENT user navigates to `/perfil`
- **THEN** the page displays the user's `nombre`, `apellido`, `email`, `telefono`, roles asignados, and `created_at` (fecha de registro)

### Scenario: Loading state
- **WHEN** the profile data is being fetched
- **THEN** the page shows a loading skeleton or spinner

### Scenario: Error state
- **WHEN** fetching profile data fails
- **THEN** the page shows an error message with a "Reintentar" button

---

## Requirement: Edit profile inline
The system SHALL allow the user to edit their personal information directly on the profile page without navigating away.

### Scenario: Enter edit mode
- **WHEN** the user clicks "Editar" button on the profile page
- **THEN** the display fields become editable input fields

### Scenario: Cancel edit
- **WHEN** the user clicks "Cancelar" while in edit mode
- **THEN** the fields revert to their original values and exit edit mode

### Scenario: Successful profile update
- **WHEN** the user modifies fields and clicks "Guardar cambios" with valid data
- **THEN** a success toast appears, the display updates with the new values, and the page exits edit mode

### Scenario: Validation errors on update
- **WHEN** the user submits invalid data (empty name, invalid email)
- **THEN** inline validation errors appear below the corresponding fields, and the form is not submitted

### Scenario: Server error on update
- **WHEN** the server returns an error (e.g., duplicate email)
- **THEN** a toast with the error message appears, the form remains in edit mode with the entered values

---

## Requirement: Change password section
The system SHALL provide a separate section on the profile page for changing the password.

### Scenario: Change password form
- **WHEN** the user is on the profile page
- **THEN** a "Cambiar contraseña" section is visible with fields for current password, new password, and confirm new password

### Scenario: Successful password change
- **WHEN** the user fills all three password fields correctly and submits
- **THEN** a success toast "Contraseña cambiada con éxito" appears and the form fields clear

### Scenario: Validation error on password change
- **WHEN** the user submits with validation errors (passwords don't match, too short)
- **THEN** inline validation errors appear below the corresponding fields

### Scenario: Password contains full email
- **WHEN** the user submits with a new password containing their full email address
- **THEN** inline validation error "La contraseña no puede contener tu email" appears

### Scenario: Server error on password change
- **WHEN** the server returns an error (wrong current password)
- **THEN** a toast with the error message appears and the form remains

---

## Requirement: Profile data fetching hooks
The system SHALL provide TanStack Query hooks for profile data fetching and mutations.

### Scenario: useProfile data fetching
- **WHEN** the ProfilePage mounts
- **THEN** `useQuery(['profile', 'me'])` fetches `GET /auth/me` with `staleTime: 300000` (5 min)

### Scenario: useUpdateProfile mutation
- **WHEN** the user submits profile edits
- **THEN** `useMutation` sends `PUT /auth/me` and on success invalidates `['profile', 'me']` and shows success toast

### Scenario: useChangePassword mutation
- **WHEN** the user submits password change
- **THEN** `useMutation` sends `PUT /auth/change-password` and on success shows success toast (no query invalidation needed)

---

## Requirement: Route protection
The `/perfil` route SHALL be accessible only to authenticated CLIENT users.

### Scenario: Protected route
- **WHEN** an unauthenticated user navigates to `/perfil`
- **THEN** the user is redirected to `/login?from=/perfil`

### Scenario: Role restriction
- **WHEN** an authenticated ADMIN user navigates to `/perfil`
- **THEN** the user is redirected to `/403`
