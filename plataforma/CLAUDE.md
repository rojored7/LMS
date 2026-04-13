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
- Classes/Types: PascalCase (`UserRole`, `ExecuteRequest`)
- Functions/methods: camelCase (`checkDatabaseConnection`, `executeCode`)
- Files: kebab-case (`auth.routes.ts`, `error-handler.ts`)
- Database tables: snake_case (`users`, `refresh_tokens`)
- Routes: kebab-case (`/api/auth`, `/api/users`)

**Test pattern:**
- Backend: `backend/src/__tests__/` (Jest) - **44+ test files** covering controllers, services, middleware, utils
- Frontend: `frontend/src/**/*.test.tsx` (Vitest) - **5 test files** for core pages
- E2E: `/e2e/` (Playwright) - **15 test specs** covering user stories HU-003 through HU-027-045
- Scripts: `npm test` (backend), `npm run test` (frontend), `make test-e2e`
- Coverage threshold: 70%

**Commit style:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## 4. HIDDEN COMPLEXITY

**Middleware chain (backend/src/server.ts):**
1. Helmet (security headers)
2. CORS (configured via `corsOptions` from config)
3. JSON/URL-encoded parsers (10mb limit)
4. Cookie parser
5. Compression
6. Request logger (winston)
7. Rate limiter (on /api/* routes)
8. Authentication middleware (`backend/src/middleware/authenticate.ts`)
9. Authorization middleware (`backend/src/middleware/authorize.ts`)
10. Error handler (must be LAST)

**Critical execution order:**
- Global error handlers MUST be registered BEFORE app initialization
- Service initialization: PostgreSQL → Redis → HTTP server
- Graceful shutdown: HTTP server → external connections (10s timeout)

**Authentication flow:**
- JWT tokens with refresh token rotation
- Tokens stored in HTTP-only cookies + Redis
- Middleware: `authenticate.ts` (required auth), `optionalAuth.ts` (optional)
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
3. Config object: `backend/src/config/index.ts`, `executor/src/config/index.ts`
4. Validation: Zod schemas for critical configs

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
- SMTP: Email notifications (nodemailer) - Gmail configured (redp41732@gmail.com)
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
- Helmet CSP headers configured (may need adjustments for inline scripts)
- Rate limiting: 100 requests/15min per IP on /api/*
- Code executor: 60s max timeout, 50KB max code size
- Passwords: bcrypt hashed (10 rounds)
- JWT expiry: **15 minutes** access (configured in .env), 7d refresh

**Generated code:**
- Prisma Client: `backend/node_modules/.prisma/client/` (regenerate: `npm run prisma:generate`)
- Do NOT commit generated client
- Migrations: Always create via `npx prisma migrate dev --name <name>`

**i18n:** **Fully implemented** - Translation model in database, translation.service.ts, LanguageSelector component

**Obfuscation:** None (open source)

## 7. QUICK REFERENCE

**Main entry points:**
- Backend: `/backend/src/server.ts`
- Frontend: `/frontend/src/main.tsx`
- Executor: `/executor/src/server.ts`

**Configuration:**
- Backend config: `/backend/src/config/index.ts`
- Executor config: `/executor/src/config/index.ts`
- Database schema: `/backend/prisma/schema.prisma`
- Docker Compose: `/docker-compose.yml`
- Environment template: `/.env.example`

**Tests:**
- Backend tests: `/backend/src/__tests__/`
- Frontend tests: `/frontend/src/**/*.test.tsx`
- Jest config (backend): `/backend/jest.config.js`
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
make migrate           # Run Prisma migrations
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
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migrate

# Start dev server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Tests
npm test
npm run test:watch
npm run test:coverage

# Prisma Studio (database GUI)
npm run prisma:studio

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Seed database
npm run seed
npm run seed:curso
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
docker-compose exec backend npm run migrate
docker-compose exec backend npx prisma studio

# Clean everything (DESTRUCTIVE)
docker-compose down -v
```

## 9. IMPORTANT NOTES

### Database Migrations

Always create migrations when modifying `schema.prisma`:

```bash
# Development
npm run migrate              # Creates migration + applies it

# Production
npm run migrate:deploy       # Applies pending migrations only
```

### Adding New Routes

1. Create controller in `backend/src/controllers/`
2. Create route file in `backend/src/routes/`
3. Register route in `backend/src/server.ts`
4. Add middleware (authenticate/authorize) as needed
5. Update API documentation

### Authentication

All protected routes must use middleware:

```typescript
// Require authentication
import { authenticate } from '../middleware/authenticate';
router.get('/protected', authenticate, controller);

// Require specific role
import { authorize } from '../middleware/authorize';
router.get('/admin', authenticate, authorize(['ADMIN']), controller);

// Optional authentication (user may or may not be logged in)
import { optionalAuth } from '../middleware/optionalAuth';
router.get('/public', optionalAuth, controller);
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

**Prisma client errors:**
```bash
# Regenerate client
cd backend && npm run prisma:generate
```

**Port conflicts:**
- Backend: 4000
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

1. Set `NODE_ENV=production`
2. Update `.env` with production secrets
3. Run migrations: `npm run migrate:deploy`
4. Build images: `docker-compose build`
5. Deploy: `make deploy`
6. Verify health endpoints: `/health`, `/health/ready`, `/health/live`

### Environment-Specific Behavior

Development:
- Hot reload enabled (nodemon, Vite HMR)
- Verbose logging
- Source maps enabled
- Prisma Studio accessible

Production:
- Optimized builds
- Error logging only
- No source maps
- Rate limiting enforced strictly
- HTTPS required (configure in Nginx)

## 10. ADVANCED FEATURES IMPLEMENTED

### Progressive Web App (PWA)
- Service worker configuration for offline access
- `PwaIndicators.tsx` component shows installation prompts
- App manifest configured for mobile/desktop installation
- Caching strategies for static assets

### Internationalization (i18n)
- **Translation** model in Prisma schema
- `translation.service.ts` manages multi-language content
- `LanguageSelector.tsx` component for language switching
- Database-driven translations for dynamic content
- Support for Spanish (primary) + additional languages

### SCORM Compliance
- **ScormPackage** model for SCORM 1.2 and 2004 support
- `ScormUploader.tsx` component for package import
- Compatible with enterprise LMS systems
- Tracking of SCORM completion and scoring

### Real-Time Features (Socket.IO)
- WebSocket server integrated in `backend/src/server.ts` (lines 50-53, 278-293)
- `chat.socket.ts` handles real-time messaging
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

1. `/api/auth` - auth.service.ts (login, register, refresh, logout, password reset)
2. `/api/users` - user.service.ts (CRUD, profile management)
3. `/api/courses` - course.service.ts (CRUD, enrollment, search)
4. `/api/modules` - module.service.ts (CRUD, ordering)
5. `/api/lessons` - lesson.service.ts (CRUD, content rendering)
6. `/api/quizzes` - quiz.service.ts (CRUD, attempts, grading)
7. `/api/labs` - lab.service.ts (CRUD, execution, submissions)
8. `/api/projects` - project.service.ts (CRUD, submissions, review)
9. `/api/progress` - progress.service.ts (tracking, completion)
10. `/api/certificates` - certificate.service.ts (generation, validation)
11. `/api/notifications` - notification.service.ts (CRUD, mark read)
12. `/api/badges` - badge.service.ts (CRUD, award logic)
13. `/api/admin` - admin.service.ts (user management, bulk operations)
14. `/api/training-profiles` - trainingProfile.service.ts (CRUD, course assignment)
15. `/api/analytics` - analytics.service.ts (statistics, exports) **[commented out in server.ts]**
16. `/api/export` - export.service.ts (CSV/PDF export) **[commented out in server.ts]**

**Additional Services**:
- token.service.ts (JWT management)
- email.service.ts (SMTP, templates)
- storage.service.ts (file uploads)
- pdf.service.ts (certificate generation)
- translation.service.ts (i18n)

**Swagger Documentation**: `/api-docs` endpoint with OpenAPI spec

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

**Backend**: 44+ test files
- Controllers: 16 test files
- Services: 16 test files
- Middleware: 6 test files (authenticate, authorize, validate, errorHandler, logger, optionalAuth)
- Utils: 2 test files
- Integration: 4 test files

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
- ⚠️ Duplicate middleware: `optionalAuth.ts` and `authenticateOptional` function
- ⚠️ Deleted migration in git status (20260304131719_add_gamification_and_executor_fields)
- ⚠️ 43 uncommitted file modifications

### Next Steps for Production Readiness

1. **Enable commented routes**: Uncomment analytics and export routes in server.ts
2. **Increase frontend test coverage**: Add tests for critical user flows
3. **Commit pending changes**: 31 backend + 12 frontend modifications
4. **Update user story tracking**: Move completed stories from pendientes/ to completadas/
5. **Document content-importer**: Add README with usage instructions
6. **Load testing**: Stress test with concurrent users
7. **Security audit**: Penetration testing for production deployment
