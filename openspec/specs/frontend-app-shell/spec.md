## ADDED Requirements

### Requirement: Frontend project scaffolded and executable
The system SHALL provide a `frontend/` directory with Vite (SWC) + React 18 + TypeScript in strict mode that starts without errors.

#### Scenario: Development server starts
- **WHEN** developer runs `npm run dev` inside `frontend/`
- **THEN** the Vite dev server starts on port 5173 without compilation errors

#### Scenario: Production build succeeds
- **WHEN** developer runs `npm run build` inside `frontend/`
- **THEN** the build completes without TypeScript errors and outputs to `dist/`

#### Scenario: TypeScript strict mode enforced
- **WHEN** a `.ts` or `.tsx` file uses implicit `any` or missing types
- **THEN** the TypeScript compiler reports an error (strict: true is set in tsconfig.json)

---

### Requirement: Tailwind CSS configured for development and production
The system SHALL have Tailwind CSS v3 configured with PostCSS so utility classes work in development and unused classes are purged in production builds.

#### Scenario: Tailwind utilities available in components
- **WHEN** a component uses a Tailwind utility class (e.g., `className="text-red-500"`)
- **THEN** the class renders the correct style in the browser

#### Scenario: Production build purges unused classes
- **WHEN** `npm run build` runs
- **THEN** the output CSS only contains classes actually used in the source files

---

### Requirement: React Router v6 scaffold with public and private outlets
The system SHALL have React Router v6 configured with a route structure that distinguishes public routes (accessible without auth) from private routes (will require auth in `frontend-shell`), using empty outlet components as placeholders.

#### Scenario: App renders without routing errors
- **WHEN** the app loads at `/`
- **THEN** no routing errors appear in the browser console

#### Scenario: Unknown routes handled
- **WHEN** user navigates to a path not defined in the router
- **THEN** a 404/not-found fallback component renders

---

### Requirement: TanStack Query client initialized at App root
The system SHALL wrap the application with `QueryClientProvider` so any component can use `useQuery` and `useMutation` hooks.

#### Scenario: QueryClient available to all components
- **WHEN** any component in the tree calls `useQueryClient()`
- **THEN** it receives the configured QueryClient instance without error

#### Scenario: QueryClient uses conservative defaults
- **WHEN** a query is created without explicit staleTime
- **THEN** the default staleTime of 5 minutes is applied (reduces unnecessary refetches)

---

### Requirement: Environment variables defined in .env.example
The system SHALL provide a `frontend/.env.example` file with all required environment variable keys so new developers can replicate the environment.

#### Scenario: .env.example contains required keys
- **WHEN** developer opens `frontend/.env.example`
- **THEN** it contains `VITE_API_BASE_URL` and `VITE_MERCADOPAGO_PUBLIC_KEY` with placeholder values

---

### Requirement: Feature-Sliced Design folder structure in place
The system SHALL have an FSD folder structure created under `frontend/src/` so all subsequent changes can add files following the established layer boundaries.

#### Scenario: FSD layers exist
- **WHEN** developer opens `frontend/src/`
- **THEN** directories `pages/`, `features/`, `entities/`, `widgets/`, and `shared/` exist
- **THEN** `shared/` contains `api/`, `stores/`, `ui/`, `lib/`, and `types/` subdirectories
