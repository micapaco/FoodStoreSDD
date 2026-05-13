# frontend-state-stores Specification

## Purpose
Define frontend Zustand stores for authentication, cart, payment flow, UI state, persistence behavior, and store subscription practices.
## Requirements
### Requirement: authStore manages authentication session state
The system SHALL provide a Zustand store `authStore` that holds the authentication session, persists tokens to localStorage, and exposes typed selectors.

#### Scenario: Store persists tokens across page reload
- **WHEN** user reloads the browser after logging in
- **THEN** `authStore.accessToken`, `refreshToken`, and `user` are restored from localStorage

#### Scenario: Store state shape is correct
- **WHEN** `authStore` is accessed
- **THEN** it exposes: `accessToken: string | null`, `refreshToken: string | null`, `user: { id, nombre, email, roles } | null`, `isAuthenticated: boolean`

#### Scenario: login action sets full session
- **WHEN** `authStore.login(tokens, user)` is called
- **THEN** `accessToken`, `refreshToken`, and `user` are set
- **THEN** `isAuthenticated` becomes `true`

#### Scenario: logout action clears session
- **WHEN** `authStore.logout()` is called
- **THEN** `accessToken`, `refreshToken`, and `user` are set to null
- **THEN** `isAuthenticated` becomes `false`

#### Scenario: updateTokens replaces tokens without clearing user
- **WHEN** `authStore.updateTokens({ accessToken, refreshToken })` is called
- **THEN** only tokens are updated; `user` remains unchanged

#### Scenario: hasRole selector returns correct boolean
- **WHEN** `authStore.hasRole('ADMIN')` is called
- **THEN** it returns `true` only if the user has that role in their `roles` array

#### Scenario: Store uses partialize to exclude transient state
- **WHEN** the store is persisted to localStorage
- **THEN** only `accessToken`, `refreshToken`, and `user` are stored (not loading flags)

---

### Requirement: cartStore manages shopping cart state with persistence
The system SHALL provide a Zustand store `cartStore` that holds cart items, persists them to localStorage, and exposes typed selectors for totals.

#### Scenario: Cart persists across browser close and reload
- **WHEN** user closes the browser and reopens the app
- **THEN** cart items are restored from localStorage

#### Scenario: Cart persists across logout and login
- **WHEN** user logs out and then logs back in
- **THEN** the cart items are still present

#### Scenario: addItem adds a new item
- **WHEN** `cartStore.addItem(producto, cantidad, personalizacion)` is called with a product not in the cart
- **THEN** the product is added with the given quantity and personalization

#### Scenario: addItem increments quantity for existing item
- **WHEN** `cartStore.addItem(producto, cantidad, personalizacion)` is called for a product already in the cart
- **THEN** the existing item's quantity is incremented

#### Scenario: removeItem removes the item
- **WHEN** `cartStore.removeItem(productoId)` is called
- **THEN** the item with that ID is removed from the cart

#### Scenario: updateQuantity changes item count
- **WHEN** `cartStore.updateQuantity(productoId, cantidad)` is called
- **THEN** the item's quantity is updated to the new value

#### Scenario: clearCart empties the cart
- **WHEN** `cartStore.clearCart()` is called
- **THEN** items array is empty

#### Scenario: totalItems selector returns correct count
- **WHEN** cart has items with quantities [2, 3]
- **THEN** `totalItems()` returns 5

#### Scenario: totalPrice selector returns correct total
- **WHEN** cart has items with precio 100 * qty 2 and precio 50 * qty 1
- **THEN** `totalPrice()` returns 250

---

### Requirement: paymentStore manages checkout flow state without persistence
The system SHALL provide a Zustand store `paymentStore` that tracks the in-progress checkout session and MUST NOT persist state to localStorage.

#### Scenario: Store state is reset on page reload
- **WHEN** user reloads the browser during checkout
- **THEN** `paymentStore` state is reset to initial values (no localStorage rehydration)

#### Scenario: Store state shape is correct
- **WHEN** `paymentStore` is accessed
- **THEN** it exposes: `checkoutStep: string`, `preferenceId: string | null`, `paymentStatus: string | null`, `error: string | null`

#### Scenario: startCheckout sets pedidoId and initial step
- **WHEN** `paymentStore.startCheckout(pedidoId)` is called
- **THEN** `checkoutStep` transitions to the first checkout step

#### Scenario: resetPayment returns store to initial state
- **WHEN** `paymentStore.resetPayment()` is called
- **THEN** all fields return to their initial null/default values

---

### Requirement: uiStore manages UI state with selective theme persistence
The system SHALL provide a Zustand store `uiStore` that manages UI state and persists only the `theme` preference to localStorage.

#### Scenario: Theme preference persists across reloads
- **WHEN** user sets theme to `dark` and reloads the browser
- **THEN** `uiStore.theme` is still `dark`

#### Scenario: sidebarOpen and toasts do NOT persist
- **WHEN** user has an open sidebar and reloads
- **THEN** `sidebarOpen` is reset to its initial value (not restored from localStorage)

#### Scenario: Store state shape is correct
- **WHEN** `uiStore` is accessed
- **THEN** it exposes: `theme: 'light' | 'dark'`, `sidebarOpen: boolean`, `toasts: Toast[]`

---

### Requirement: All stores use slice subscription to minimize re-renders
The system SHALL ensure that all store consumers subscribe by slice, not by full store object.

#### Scenario: Slice subscription prevents unnecessary re-renders
- **WHEN** a component subscribes to a single field via `useStore(s => s.field)`
- **THEN** the component only re-renders when THAT field changes, not when other store fields update

#### Scenario: Direct full store subscription is not used
- **WHEN** reviewing store usage across the codebase
- **THEN** no component uses `useAuthStore()` or `useCartStore()` without a selector function

### Requirement: Auth store normalizes persisted roles
The system SHALL normalize persisted auth users so `user.roles` is always treated as a string array before role checks are evaluated.

#### Scenario: Persisted user has roles array
- **WHEN** `authStore` rehydrates a user whose `roles` field is an array of strings
- **THEN** role checks use those roles unchanged

#### Scenario: Persisted user has missing roles
- **WHEN** `authStore` rehydrates a user whose `roles` field is missing
- **THEN** the store normalizes `roles` to an empty array
- **THEN** components do not crash when checking roles

#### Scenario: Persisted user has invalid roles
- **WHEN** `authStore` rehydrates a user whose `roles` field contains non-string values
- **THEN** the store filters non-string values before persisting or checking roles

#### Scenario: Role helper is used for UI permission checks
- **WHEN** navigation, headers, guards or role-aware pages evaluate roles
- **THEN** they use safe role access instead of directly assuming `user.roles` is present

