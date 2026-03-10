# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. PROJECT IDENTITY

**Purpose**: Frontend SPA for multi-course cybersecurity learning platform with JWT auth, role-based access control, and real-time course progress tracking.

**Stack**: React 18, TypeScript 5, Vite 5, Zustand 4, TanStack Query 5, Axios, Tailwind CSS 3, React Router 6

**Type**: Single-Page Application (SPA)

## 2. ARCHITECTURE PATTERNS

**Pattern**: Component-based architecture with centralized state management and layered service architecture
- Entry point: `src/main.tsx` → `src/App.tsx` (routing)
- Data flow: Components → Hooks → Stores/Services → API Client → Backend
- Core packages:
  - Public API: `src/pages/*` (route components), `src/components/common/*` (reusable UI)
  - Internal: `src/services/*` (API layer), `src/store/*` (state), `src/hooks/*` (logic)
  - Generated: `node_modules/*`, `dist/*` (DO NOT MODIFY)

## 3. DETECTED CONVENTIONS

**Code language**: Spanish in UI strings and comments, English for variables/functions/types (Mixed)

**Naming patterns**:
- Files: kebab-case (`auth-store.ts`, `course-detail.tsx`)
- Components: PascalCase files and exports (`CourseDetail.tsx` exports `CourseDetail`)
- TypeScript: PascalCase for types/interfaces, camelCase for functions/variables
- Stores: `use[Name]Store` hook pattern (`useAuthStore`, `useCourseStore`)
- Services: `[domain].service.ts` with default export object (`authService`)

**Test pattern**:
- Vitest + React Testing Library configured in `vite.config.ts`
- Setup file: `src/tests/setup.ts`
- Test files: `*.test.ts` or `*.spec.tsx` (currently not implemented)

## 4. HIDDEN COMPLEXITY

**Axios Interceptor Chain (CRITICAL)**:
- Request interceptor (src/services/api.ts:24): Auto-injects JWT from localStorage into Authorization header
- Response interceptor (src/services/api.ts:49): Handles token refresh on 401 errors
- Singleton `refreshTokenPromise` pattern prevents multiple simultaneous refresh calls
- Token refresh flow: 401 → check `refreshToken` in localStorage → POST /auth/refresh → update `accessToken` → retry original request
- If refresh fails: clears localStorage, redirects to `/login`, rejects promise

**Zustand Persistence Middleware**:
- `authStore` uses `persist()` middleware with localStorage
- Only persists: `user`, `accessToken`, `refreshToken`, `isAuthenticated` (src/store/authStore.ts:156)
- Actions and transient state (isLoading, error) NOT persisted
- Key: `auth-storage` in localStorage

**Route Protection Logic (ProtectedRoute)**:
- Order matters: Loading check → Auth check → Role check (src/components/layout/ProtectedRoute.tsx:54-69)
- Missing auth: redirect to `/login` with `state: { from: location }` for post-login redirect
- Missing role: redirect to `/403` (Forbidden), not `/404`
- `requiredRoles` accepts array for OR logic (user needs ANY of the roles)

**TanStack Query Configuration**:
- Global config in App.tsx:31: `refetchOnWindowFocus: false`, `retry: 1`, `staleTime: 5min`
- Used primarily via custom hooks (e.g., `useCourses`) wrapping service calls
- Not all API calls use React Query; some use Zustand store actions directly

**Vite Path Aliases**:
- Configured in both `vite.config.ts` and `tsconfig.json` (MUST match)
- Aliases: `@/`, `@components/`, `@pages/`, `@hooks/`, `@services/`, `@store/`, `@types/`, `@utils/`
- Import resolution: TypeScript uses tsconfig paths, Vite uses vite.config aliases

**Environment Variable Loading**:
- Vite-specific prefix: `VITE_*` required for client exposure
- Access via `import.meta.env.VITE_*` (NOT `process.env`)
- Defaults in `src/utils/constants.ts` if env var undefined
- Build-time substitution (changes require rebuild)

**Toast Auto-Removal Timer**:
- `uiStore.addToast()` creates setTimeout for auto-removal (src/store/uiStore.ts:101)
- Timer ID not stored; cannot be canceled manually
- Potential memory leak if component unmounts before timeout (no cleanup)

## 5. BUSINESS RULES

**Main entities**:
- **User**: Three roles (STUDENT, INSTRUCTOR, ADMIN), stored in auth store with isAuthenticated flag
- **Course**: Accessed via ID or slug, enrollment creates idempotent relationship
- **Enrollment**: Managed via `enrollInCourse()`, triggers refresh of enrolledCourses array
- **Toast**: Auto-dismisses after duration, sequential ID from counter (not UUID)

**Critical workflows**:
1. **Auth Flow**: Login → Store tokens in localStorage + Zustand → Axios interceptor adds to headers → 401 triggers refresh → Refresh fail clears auth
   - Entry: `src/pages/Login.tsx` → `authStore.login()` → `authService.login()`
2. **Protected Navigation**: Route access → ProtectedRoute checks auth → Checks role → Redirects to /login or /403 if unauthorized
   - Entry: `src/App.tsx` routes with `<ProtectedRoute requiredRoles={[...]}>`
3. **Course Enrollment**: Enroll button → `courseStore.enrollInCourse()` → Refresh enrolledCourses → Update selectedCourse if viewing same course
   - Entry: `src/pages/CourseDetail.tsx` → `courseStore.enrollInCourse()`

**External integrations**:
- Backend API via Axios (default: http://localhost:3000/api, configurable via VITE_API_URL)
- LocalStorage for token persistence and auth state
- Dark mode via Tailwind `dark:` classes and document.documentElement.classList

**State machines**:
- Theme toggle: light ↔ dark (uiStore, updates DOM classList)
- Auth state: unauthenticated → loading → authenticated → (error) → unauthenticated
- Sidebar: open ↔ closed (uiStore, persists across navigation)

## 6. DEVELOPMENT CONSTRAINTS

**Environment Variables**:
- MUST prefix with `VITE_` to expose to client
- Changes require dev server restart (`npm run dev` must be restarted)
- Production build bakes values in; cannot change without rebuild

**TypeScript Path Aliases**:
- When adding aliases: update BOTH `tsconfig.json` paths AND `vite.config.ts` resolve.alias
- TypeScript type-checks with tsconfig, Vite bundles with vite.config
- Mismatch causes type errors in IDE but build success (or vice versa)

**Generated Code Paths**:
- `node_modules/` (npm dependencies)
- `dist/` (Vite build output)
- Never edit these directly; changes will be overwritten

**Tailwind Configuration**:
- Custom utilities in `tailwind.config.js` content paths must include all component locations
- Dark mode: class-based strategy (src/store/uiStore.ts toggles `dark` class on `<html>`)
- PostCSS processes Tailwind directives in `src/index.css`

**Component Import Conventions**:
- Use path aliases (`@components/common/Button` not `../../components/common/Button`)
- Barrel exports in `src/types/index.ts`, `src/hooks/index.ts`, `src/services/index.ts`
- Pages export from `src/pages/index.ts` for cleaner imports in App.tsx

## 7. QUICK REFERENCE

**Entry Points**:
- Main: `/src/main.tsx`
- App with routing: `/src/App.tsx`
- API client: `/src/services/api.ts`
- Auth store: `/src/store/authStore.ts`

**Configuration**:
- Environment: `/.env` (copy from `.env.example`)
- Vite: `/vite.config.ts`
- TypeScript: `/tsconfig.json`
- Tailwind: `/tailwind.config.js`
- ESLint: `/.eslintrc.json`

**Scripts**:
- Dev: `npm run dev` (port 3000)
- Build: `npm run build` (TypeScript check + Vite build)
- Preview: `npm run preview` (preview production build)
- Lint: `npm run lint` (ESLint with max 0 warnings)
- Format: `npm run format` (Prettier)
- Type check: `npm run type-check` (TypeScript without emit)
- Test: `npm test` (Vitest, not yet implemented)

**Key Directories**:
- Components: `/src/components/` (common/, layout/)
- Pages: `/src/pages/` (route components)
- Services: `/src/services/` (API layer)
- Stores: `/src/store/` (Zustand state)
- Hooks: `/src/hooks/` (custom React hooks)
- Types: `/src/types/` (TypeScript definitions)
- Utils: `/src/utils/` (constants, formatters, validators, cn helper)

## 8. COMMON DEVELOPMENT TASKS

**Running the App**:
```bash
# Development server with HMR (Vite)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

**Code Quality**:
```bash
# Run ESLint (fails on warnings)
npm run lint

# Auto-fix ESLint issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changes
npm run format:check

# Type-check without build
npm run type-check
```

**Adding New Features**:

1. **New Page/Route**:
   - Create component in `src/pages/NewPage.tsx`
   - Export from `src/pages/index.ts`
   - Add route in `src/App.tsx` Routes
   - Wrap with `<ProtectedRoute>` if auth required

2. **New API Endpoint**:
   - Add function to appropriate service file (e.g., `src/services/course.service.ts`)
   - Define TypeScript types in `src/types/[domain].ts`
   - Call from component via hook or store action
   - Use existing `api` client from `src/services/api.ts` for automatic auth headers

3. **New Zustand Store**:
   - Create `src/store/newStore.ts` with `create<State>()`
   - Export custom hook `useNewStore`
   - Add to barrel export `src/store/index.ts`
   - Use `persist()` middleware if state needs localStorage persistence

4. **New Protected Route with Role**:
   ```tsx
   <Route path="/instructor-panel" element={
     <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
       <InstructorPanel />
     </ProtectedRoute>
   } />
   ```

**Environment Setup**:
```bash
# Copy environment template
cp .env.example .env

# Edit .env (remember VITE_ prefix)
# VITE_API_URL=http://localhost:4000/api
```

**Port Configuration**:
- Dev server: 3000 (Vite, configurable in vite.config.ts)
- API proxy: `/api/*` proxies to `VITE_API_URL` (default: http://localhost:8000)
- Preview: 4173 (Vite preview server)

**Important Notes**:
- Vite HMR reflects changes instantly; no restart needed for `.tsx` edits
- Changes to `vite.config.ts`, `.env`, or `package.json` require dev server restart
- Dark mode toggled via `uiStore.toggleTheme()`, persists in Zustand
- JWT tokens expire per backend config; frontend auto-refreshes via interceptor
- 401 responses trigger automatic token refresh; only redirects to login if refresh fails
- Path aliases resolve differently in TypeScript (tsconfig) vs Vite (vite.config); keep in sync
