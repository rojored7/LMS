# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. PROJECT IDENTITY

**Purpose:** Multi-course cybersecurity learning platform (LMS) with executable code labs in Docker sandboxes, role-based access control, and certificate generation.

**Stack:** Python 3.12 / FastAPI / SQLAlchemy / Alembic / React 18 / PostgreSQL 15 / Redis 7 / Docker

**Type:** Monorepo with 3 main services (FastAPI API, React Web, Node.js Code Executor)

## 2. ARCHITECTURE PATTERNS

**Pattern:** Multi-service monorepo. Backend migrated from Express/Prisma to FastAPI/SQLAlchemy (April 2026).

**Entry points:**
- Backend API: `backend-fastapi/app/main.py`
- Frontend: `frontend/src/main.tsx` -> `App.tsx`
- Code Executor: `executor/src/server.ts` (Node.js, unchanged)

**Core packages:**
- Backend routers: `backend-fastapi/app/routers/` (auth, courses, users, badges, notifications, certificates, progress, training_profiles, admin)
- Backend services: `backend-fastapi/app/services/`
- Backend models: `backend-fastapi/app/models/` (SQLAlchemy)
- Backend schemas: `backend-fastapi/app/schemas/` (Pydantic DTOs)
- Backend middleware: `backend-fastapi/app/middleware/` (auth, error_handler, rate_limit)
- Frontend components: `frontend/src/components/`, `frontend/src/pages/`
- Frontend services: `frontend/src/services/` (API clients)
- Frontend state: `frontend/src/store/` (Zustand stores)
- Executor services: `executor/src/services/dockerExecutor.ts`

**Database:**
- Models: `backend-fastapi/app/models/` (24 SQLAlchemy models in 6 files)
- Migrations: `backend-fastapi/alembic/versions/`
- **Enums**: UserRole, CourseLevel, LessonType, QuestionType, ProjectStatus, NotificationType

## 3. DETECTED CONVENTIONS

**Code language:** Mixed Spanish/English
- Spanish: User-facing strings, comments, git commit messages
- English: Code (variables, functions, types)

**Naming patterns:**
- Backend Python: snake_case for modules and functions (`auth_service.py`, `get_current_user`)
- Backend Classes/Enums: PascalCase (`UserRole`, `CreateCourseRequest`)
- Frontend TypeScript: PascalCase for types/components, camelCase for functions
- Database tables: snake_case (`users`, `refresh_tokens`)
- Routes: kebab-case (`/api/auth`, `/api/users`)

**Test pattern:**
- Backend: `backend-fastapi/tests/` (pytest) - test files covering routers, services, middleware, models
- Frontend: `frontend/src/**/*.test.tsx` (Vitest) - **5 test files** for core pages
- E2E: `/e2e/` (Playwright) - **15 test specs** covering user stories HU-003 through HU-027-045
- Scripts: `pytest` (backend), `npm run test` (frontend), `make test-e2e`
- Coverage threshold: 70%

**Commit style:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## 4. HIDDEN COMPLEXITY

**Middleware chain (backend-fastapi/app/main.py):**
1. CORS middleware (FastAPI CORSMiddleware)
2. Request logger middleware
3. Rate limiter (slowapi on /api/* routes)
4. Error handler middleware
5. Authentication dependencies (`app/middleware/auth.py` - get_current_user)
6. Authorization dependencies (`app/middleware/auth.py` - require_role)

**Critical execution order:**
- FastAPI lifespan events handle startup/shutdown (database pool, Redis connection)
- Service initialization: PostgreSQL (async engine) -> Redis -> uvicorn server
- Graceful shutdown via lifespan context manager

**Authentication flow:**
- JWT tokens with refresh token rotation (python-jose)
- Tokens stored in Redis for blacklist
- Dependencies: `get_current_user` (required auth), `get_optional_user` (optional)
- Password reset tokens: single-use, expiring

**Docker Executor security:**
- Sandboxed execution in ephemeral containers
- Network disabled (`--network none`)
- Resource limits: CPU, memory, timeout (1-60s configurable)
- Languages: Python 3, Node.js, Bash
- Rate limiting per IP

**Database constraints:**
- Unique: email, trainingProfile.slug, course.slug
- Cascade deletes: User → RefreshTokens, Enrollments, Progress
- Indexes on: email, role, trainingProfileId, userId, courseId

**Configuration loading:**
1. `.env` file (required in development)
2. Environment variables (override .env)
3. Config object: `backend-fastapi/app/config.py` (Pydantic Settings), `executor/src/config/index.ts`
4. Validation: Pydantic Settings with validators for critical configs

## 5. BUSINESS RULES

**Core entities:**
- **User**: Roles (ADMIN, INSTRUCTOR, STUDENT), assigned TrainingProfile, has enrollments
- **Course**: Belongs to multiple TrainingProfiles, has Modules, prerequisites
- **Module**: Sequential order, has Lessons/Quizzes/Labs/Projects
- **Enrollment**: User-Course relationship, tracks overall progress percentage
- **UserProgress**: Per-module completion tracking
- **Certificate**: Generated when course 100% complete

**Critical workflows:**
1. **User Registration**: Create User → Assign STUDENT role → Create RefreshToken → Send welcome email
2. **Course Enrollment**: Check prerequisites → Create Enrollment → Initialize UserProgress for each Module
3. **Lab Submission**: Validate code → Execute in sandbox → Store results → Update UserProgress
4. **Certificate Generation**: Check 100% completion → Generate PDF → Send email → Mark as issued

**External integrations:**
- PostgreSQL: Main data store
- Redis: Session cache, rate limiting, JWT blacklist
- SMTP: Email notifications - Gmail configured
- Docker Engine: Code execution sandbox
- Socket.IO: Real-time WebSocket connections for chat and notifications
- Content Importer: Dedicated service for Markdown-to-database course import

**State machines:**
- Enrollment status: ACTIVE, COMPLETED, DROPPED
- Quiz/Lab submission: PENDING → PASSED/FAILED
- Certificate: issued (boolean)

## 6. DEVELOPMENT CONSTRAINTS

**Environment variables (REQUIRED):**
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL` or `REDIS_PASSWORD`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: Min 32 chars
- `CORS_ORIGIN`: Frontend URL(s)
- `EXECUTOR_URL`: Code executor service URL

**Docker Compose dependencies:**
- Backend depends on: postgres, redis
- Frontend depends on: backend
- Executor: standalone (only needs Docker socket)
- Nginx: reverse proxy for all services

**Security constraints:**
- Security headers configured via middleware/Nginx
- Rate limiting: 100 requests/15min per IP on /api/* (slowapi)
- Code executor: 60s max timeout, 50KB max code size
- Passwords: bcrypt hashed via passlib
- JWT expiry: **15 minutes** access (configured in .env), 7d refresh

**Generated code:**
- Alembic migrations: `backend-fastapi/alembic/versions/`
- Do NOT edit migrations manually
- Migrations: Always create via `alembic revision --autogenerate -m "<name>"` then `alembic upgrade head`

**i18n:** **Fully implemented** - Translation model in database, translation.service.ts, LanguageSelector component

**Obfuscation:** None (open source)

## 7. QUICK REFERENCE

**Main entry points:**
- Backend: `/backend-fastapi/app/main.py`
- Frontend: `/frontend/src/main.tsx`
- Executor: `/executor/src/server.ts`

**Configuration:**
- Backend config: `/backend-fastapi/app/config.py`
- Executor config: `/executor/src/config/index.ts`
- Database models: `/backend-fastapi/app/models/`
- Alembic config: `/backend-fastapi/alembic.ini`
- Docker Compose: `/docker-compose.yml`
- Environment template: `/.env.example`

**Tests:**
- Backend tests: `/backend-fastapi/tests/`
- Frontend tests: `/frontend/src/**/*.test.tsx`
- Pytest config (backend): `/backend-fastapi/pyproject.toml`
- Vitest config (frontend): `/frontend/vite.config.ts`

**Documentation:**
- Architecture: `/docs/arquitectura.md`
- User stories: `/docs/historias-usuario/`
- Backlog: `/docs/backlog.md`
- Progress tracking: `/PROGRESS.md`

**Scripts:**
- Utility scripts: `/scripts/`
- Content importer: `/content-importer/src/`

## 8. COMMON COMMANDS

### Full Platform (Makefile)

```bash
# Start all services (Docker Compose)
make start

# Stop all services
make stop

# View logs (all services)
make logs

# View logs (specific service)
make logs-backend
make logs-frontend
make logs-executor

# Import initial cybersecurity course
make seed

# Run all tests
make test

# Run tests for specific service
make test-backend
make test-frontend

# Database operations
make migrate           # Run Alembic migrations
make reset-db          # Reset database (DESTRUCTIVE)
make shell-db          # Open PostgreSQL shell
make backup            # Create database backup

# Development shells
make shell-backend     # Shell in backend container
make shell-frontend    # Shell in frontend container

# Production deployment
make deploy
```

### Backend (Development)

```bash
cd backend-fastapi

# Install dependencies
pip install -e ".[dev]"

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Start dev server (with hot reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 4000

# Tests
pytest
pytest --cov=app
pytest -x -v  # stop on first failure, verbose

# Linting
ruff check .
ruff format .

# Seed database
python -m app.scripts.seed_base
```

### Frontend (Development)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Tests
npm test
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Format code
npm run format
npm run format:check
```

### Executor (Development)

```bash
cd executor

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Tests
npm test
```

### Docker Compose (Direct)

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Run command in service
docker-compose exec backend alembic upgrade head
docker-compose exec backend python -m app.scripts.seed_base

# Clean everything (DESTRUCTIVE)
docker-compose down -v
```

## 9. IMPORTANT NOTES

### Database Migrations

Always create migrations when modifying SQLAlchemy models:

```bash
# Development - create and apply migration
alembic revision --autogenerate -m "description"
alembic upgrade head

# Production - apply pending migrations only
alembic upgrade head
```

### Adding New Routes

1. Create service in `backend-fastapi/app/services/`
2. Create schemas in `backend-fastapi/app/schemas/`
3. Create router in `backend-fastapi/app/routers/`
4. Register router in `backend-fastapi/app/main.py`
5. Add auth dependencies (get_current_user/require_role) as needed
6. Update API documentation

### Authentication

All protected routes use FastAPI dependencies:

```python
from app.middleware.auth import get_current_user, require_role
from app.models.user import UserRole

# Require authentication
@router.get("/protected")
async def protected_endpoint(user = Depends(get_current_user)):
    ...

# Require specific role
@router.get("/admin")
async def admin_endpoint(user = Depends(require_role(UserRole.ADMIN))):
    ...

# Optional authentication
@router.get("/public")
async def public_endpoint(user = Depends(get_optional_user)):
    ...
```

### Code Executor Security

The executor service MUST:
- Run code in isolated containers
- Disable network access
- Set strict timeouts (default 30s, max 60s)
- Limit resource usage
- Clean up containers after execution

Never allow:
- File system persistence across executions
- Network access from sandboxes
- Privileged container operations
- Code execution without validation

### Testing Strategy

- **Unit tests**: Individual functions, utilities
- **Integration tests**: API endpoints, database operations
- **E2E tests**: Full user flows (frontend)
- Maintain 70%+ coverage

### Common Troubleshooting

**Database connection issues:**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Reset connection
make restart
```

**SQLAlchemy/Alembic errors:**
```bash
# Check current migration state
cd backend-fastapi && alembic current

# Re-run migrations
alembic upgrade head
```

**Port conflicts:**
- Backend (FastAPI): 4000
- Frontend: 3000
- Executor: 5000
- PostgreSQL: 5433 (external), 5432 (internal)
- Redis: 6380 (external), 6379 (internal)
- Nginx: 80

Change ports in `.env` if needed.

### Development Workflow

1. Check backlog: `docs/backlog.md`
2. Pick user story from `docs/historias-usuario/pendientes/`
3. Create feature branch: `git checkout -b feature/HU-XXX-description`
4. Implement + test
5. Move story to `docs/historias-usuario/completadas/`
6. Update `PROGRESS.md`
7. Commit with conventional commits: `feat: Implement HU-XXX`
8. Create PR

### Production Deployment

1. Set `ENVIRONMENT=production`
2. Update `.env` with production secrets
3. Run migrations: `alembic upgrade head`
4. Build images: `docker-compose build`
5. Deploy: `make deploy`
6. Verify health endpoints: `/health`, `/health/ready`, `/health/live`

### Environment-Specific Behavior

Development:
- Hot reload enabled (uvicorn --reload, Vite HMR)
- Verbose logging
- Debug mode enabled
- Swagger docs accessible at /docs

Production:
- Optimized builds (uvicorn with workers)
- Error logging only
- Rate limiting enforced strictly
- HTTPS required (configure in Nginx)

## 10. ADVANCED FEATURES IMPLEMENTED

### Progressive Web App (PWA)
- Service worker configuration for offline access
- `PwaIndicators.tsx` component shows installation prompts
- App manifest configured for mobile/desktop installation
- Caching strategies for static assets

### Internationalization (i18n)
- **Translation** model in SQLAlchemy models
- Translation service manages multi-language content
- `LanguageSelector.tsx` component for language switching
- Database-driven translations for dynamic content
- Support for Spanish (primary) + additional languages

### SCORM Compliance
- **ScormPackage** model for SCORM 1.2 and 2004 support
- `ScormUploader.tsx` component for package import
- Compatible with enterprise LMS systems
- Tracking of SCORM completion and scoring

### Real-Time Features (Socket.IO)
- WebSocket server (pendiente de migracion a FastAPI WebSockets)
- Chat messaging functionality
- **ChatMessage** model stores chat history
- Course-specific chat rooms for collaboration
- `ChatWidget.tsx` component for in-app messaging
- Real-time notifications via WebSocket
- Online presence indicators

### Gamification System
- **Badge** and **UserBadge** models for achievements
- XP/points tracking in User model
- `BadgesShowcase.tsx` displays earned badges
- `XPProgress.tsx` shows progress bars
- `NotificationBell.tsx` for achievement alerts
- Automated badge awarding on milestones

### Analytics & Reporting
- `AnalyticsDashboard.tsx` page with comprehensive metrics
- `analytics.service.ts` aggregates platform statistics
- Export functionality for CSV/PDF reports
- Visualizations: `EnrollmentChart.tsx`, `CompletionRateChart.tsx`
- Track: enrollments, completion rates, time-on-platform, quiz scores
- Admin-only access with role-based filtering

### Frontend Component Library (60+ components)

**Common Components** (16):
- Button, Input, Card, Modal, Toast, Badge, Spinner
- LoadingSpinner, EmptyState, ConfirmDialog
- ThemeToggle, LanguageSelector, VideoEmbed
- ExportButton, PwaIndicators

**Layout** (4):
- Header, Footer, Sidebar, ProtectedRoute

**Learning** (13):
- LessonContent, QuizTaker, CodeEditor, LabExecutor
- ModuleCard, ProgressBar, CompletionBadge
- VideoPlayer, PdfViewer, MarkdownRenderer
- InteractiveExercise, HintSystem, ResourceLibrary

**Admin** (7):
- StatsCards, UserRow, CourseRow, EnrollmentChart
- ActivityLog, BulkActions, QuickStats

**Gamification** (3):
- BadgesShowcase, XPProgress, NotificationBell

**Lab** (2):
- TerminalOutput, LabLayout

**Quiz** (3):
- QuestionEditor, QuizPreview, QuizAttemptsHistory

**Projects** (4):
- FileUploader, SubmissionCard, RubricEditor, PeerReview

**Certificates** (2):
- CertificateCard, CertificatePreview

**Notifications** (1):
- NotificationList

**Profile** (1):
- PublicBadges

**Chat** (1):
- ChatWidget (real-time)

### API Routes (16 groups, 21 services)

1. `/api/auth` - auth_service.py (login, register, refresh, logout, password reset)
2. `/api/users` - user_service.py (CRUD, profile management)
3. `/api/courses` - course_service.py (CRUD, enrollment, search)
4. `/api/modules` - module management (in course routers)
5. `/api/lessons` - lesson management (in course routers)
6. `/api/quizzes` - quiz_service.py (CRUD, attempts, grading)
7. `/api/labs` - lab routers (CRUD, execution, submissions)
8. `/api/projects` - project management
9. `/api/progress` - progress_service.py (tracking, completion)
10. `/api/certificates` - certificate_service.py (generation, validation)
11. `/api/notifications` - notification management
12. `/api/badges` - badge management
13. `/api/admin` - admin routers (user management, bulk operations)
14. `/api/training-profiles` - training profile management
15. `/api/analytics` - analytics (pendiente)
16. `/api/export` - data export (pendiente)

**Additional Services**:
- auth_service.py (JWT management)
- executor_client.py (code execution via Docker sandbox)
- certificate_service.py (PDF generation)
- progress_service.py (progress calculation)

**Swagger Documentation**: `/docs` endpoint (FastAPI auto-generated OpenAPI)

### State Management (Zustand)

- **authStore.ts**: User authentication, tokens, localStorage persistence
- **courseStore.ts**: Course catalog, enrollment state, active course
- **uiStore.ts**: Theme (dark/light), sidebar toggle, toast notifications
- **index.ts**: Barrel exports for clean imports

### Pages Implemented (21)

**Public**:
1. Home.tsx - Landing page
2. Login.tsx - User authentication
3. Register.tsx - User registration
4. ForgotPassword.tsx - Password reset request
5. ResetPassword.tsx - Password reset confirmation

**Student**:
6. Dashboard.tsx - Student dashboard with enrolled courses
7. Profile.tsx - User profile editor
8. CourseCatalog.tsx - Browse available courses
9. CourseDetail.tsx - Course overview before enrollment
10. CourseLearning.tsx - Full-screen immersive learning UI
11. ProjectSubmission.tsx - Submit project files
12. NotificationsPage.tsx - View all notifications
13. PublicProfile.tsx - Public user profile view

**Admin**:
14. AdminDashboard.tsx - Admin overview with stats
15. UsersList.tsx - Manage users (CRUD, search, filter)
16. UserProgressDetail.tsx - Detailed student progress view
17. TrainingProfiles.tsx - Manage training paths
18. SubmissionsReview.tsx - Review project submissions
19. QuizBuilder.tsx - Create/edit quizzes
20. AnalyticsDashboard.tsx - Platform analytics

**Error**:
21. NotFound.tsx / Forbidden.tsx - Error pages

### Test Coverage Summary

**Backend (pytest)**: tests/ directory
- test_auth/: auth router and token service tests
- test_admin/: admin service tests
- test_models/: gamification and progress model tests
- test_middleware/: auth middleware tests
- test_progress/: progress service tests
- test_health.py: health endpoint tests

**Frontend**: 5 test files
- Login.test.tsx
- Register.test.tsx
- Dashboard.test.tsx
- CourseDetail.test.tsx
- AdminDashboard.test.tsx

**E2E**: 15 Playwright test specs
- auth.spec.ts
- courses.spec.ts
- HU-003-rbac.spec.ts (RBAC)
- HU-004-middleware-auth.spec.ts (Auth middleware)
- HU-005-password-recovery.spec.ts (Password reset)
- HU-006-lista-usuarios.spec.ts (User list)
- HU-007-010-admin-dashboard.spec.ts (Admin dashboard)
- HU-011-015-multicurso.spec.ts (Multi-course)
- HU-016-023-contenido-quizzes.spec.ts (Content + quizzes)
- HU-022-026-laboratorios.spec.ts (Labs)
- HU-027-045-proyectos-gamificacion.spec.ts (Projects + gamification)

**Helpers**: auth.ts, course.ts, admin.ts (E2E test utilities)

### Project Maturity Assessment

**Actual Implementation Status**: 75-80% complete MVP

**Implemented**:
- ✅ Complete authentication & authorization (JWT + RBAC)
- ✅ Multi-course system with training profiles
- ✅ Content rendering (lessons, quizzes, labs, projects)
- ✅ Code executor with Docker sandboxing
- ✅ Progress tracking and certificates
- ✅ Admin dashboard with user management
- ✅ Gamification (badges, XP, notifications)
- ✅ Real-time chat (Socket.IO)
- ✅ Internationalization (i18n)
- ✅ PWA support
- ✅ SCORM compliance
- ✅ Analytics framework
- ✅ Comprehensive test suite (44+ backend, 15 E2E)

**Partially Implemented**:
- ⚠️ Analytics routes (service exists, routes commented out)
- ⚠️ Export routes (service exists, routes commented out)
- ⚠️ Frontend test coverage (only 5 tests for 60+ components)

**Known Issues**:
- Backend migrado de Express/Prisma a FastAPI/SQLAlchemy (abril 2026)
- El directorio backend/ original fue eliminado; ahora es backend-fastapi/
- Uncommitted file modifications pendientes de commit

### Next Steps for Production Readiness

1. **Enable pending routes**: Implement analytics and export routers in FastAPI
2. **Increase frontend test coverage**: Add tests for critical user flows
3. **Commit pending changes**: Backend and frontend modifications
4. **Update user story tracking**: Move completed stories from pendientes/ to completadas/
5. **Migrate Socket.IO**: Port real-time chat to FastAPI WebSockets
6. **Load testing**: Stress test with concurrent users
7. **Security audit**: Penetration testing for production deployment
