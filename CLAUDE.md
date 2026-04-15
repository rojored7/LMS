# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. PROJECT IDENTITY

**Purpose**: Multi-course cybersecurity learning management system (LMS) with executable code labs, multi-profile training paths, and automated evaluation.

**Stack**: Python 3.12, FastAPI, SQLAlchemy 2.0 async, React 18, PostgreSQL 15, Redis 7, Docker

**Type**: Microservices web platform (Backend API + Frontend SPA + Code Executor)

## 2. ARCHITECTURE PATTERNS

**Pattern**: Three-tier microservices with shared database
- Backend: FastAPI REST API with layered architecture (routers → services → SQLAlchemy models)
- Frontend: React SPA with component-based architecture (pages → components → hooks → services)
- Executor: Isolated Docker-based code execution service

**Entry Points**:
- Backend: `plataforma/backend-fastapi/app/main.py`
- Frontend: `plataforma/frontend/src/main.tsx`
- Executor: `plataforma/executor/src/server.ts`

**Core Packages**:
- Public API: `/api/auth`, `/api/courses`, `/api/users` (REST endpoints)
- Internal: `app/services/*` (business logic), `app/middleware/*` (auth, validation)
- Generated: `alembic/versions/*`, `node_modules/*` (DO NOT MODIFY)

## 3. DETECTED CONVENTIONS

**Code Language**: Spanish in comments and UI strings, English for variable/function names (Mixed)

**Naming Patterns**:
- Backend Python: snake_case for modules and functions (`auth_service.py`, `get_current_user`)
- Backend Classes/Enums: PascalCase (`UserRole`, `CourseService`)
- Frontend TypeScript: PascalCase for types/components, camelCase for functions
- Routes: REST convention (`/api/courses/{id}/enroll`)
- Database: snake_case (`users`, `refresh_tokens`)

**Test Pattern**:
- Backend: pytest with `backend-fastapi/tests/` directory
- Frontend: Vitest + React Testing Library (5 test files)
- E2E: Playwright (15 test specs in /e2e)
- Test files: `test_*.py` (backend), `*.test.tsx` (frontend)

## 4. HIDDEN COMPLEXITY

**Middleware Chain (Backend FastAPI)**:
- FastAPI lifespan events handle startup/shutdown (database pool, Redis)
- Middleware stack: CORS → SecurityHeaders → SlowAPI rate limiter → error handler
- Authentication via FastAPI dependencies:
  - `get_current_user`: Required auth, raises 401 if no token
  - `get_optional_user`: Optional auth, returns None if no token

**SQLAlchemy Connection Management**:
- Async engine with asyncpg in `app/database.py`
- Session factory via `get_db` FastAPI dependency
- Connection pool size 10, max overflow 20
- Lifespan handles graceful shutdown

**Redis Connection**:
- Async redis client singleton in `app/main.py` lifespan
- Used for: JWT token blacklist, rate limiting
- Must configure via `REDIS_URL` env var

**JWT Token Flow**:
- Access token: 15 minutes expiry (configured via `JWT_EXPIRES_IN_MINUTES` in .env)
- Refresh token: 7 days expiry, stored in database `refresh_tokens` table
- Token blacklist in Redis for logout/revocation
- Automatic token refresh via `/api/auth/refresh` endpoint

**Docker Executor Security**:
- Each code execution creates ephemeral Docker container
- Network disabled, resource limits enforced
- Timeout: 30 seconds default
- Sandboxed Alpine Linux image with Python/Node.js/Bash

**Configuration Loading Order**:
1. Environment variables from `.env` file
2. Docker Compose environment overrides
3. Pydantic Settings in `backend-fastapi/app/config.py`
4. Validation via Pydantic field validators on startup

## 5. BUSINESS RULES

**Main Entities** (24 SQLAlchemy models + 6 enums):
- **User**: Three roles (ADMIN, INSTRUCTOR, STUDENT), each with different permissions
- **Course**: Published/unpublished state, supports slug or ID for lookups
- **TrainingProfile**: Multi-profile training paths with course associations
- **Enrollment**: Unique constraint on (userId, courseId), idempotent enrollment (returns existing if duplicate)
- **Module/Lesson**: Ordered content with progress tracking (includes UserLessonProgress)
- **Quiz/Question**: Auto-graded with QuizAttempt tracking (max 3 attempts default)
- **Lab**: Code execution labs with LabSubmission tracking
- **Project**: Student projects with ProjectSubmission and review workflow
- **Certificate**: Auto-generated PDF certificates on course completion
- **Badge**: Gamification system with UserBadge achievements
- **Notification**: Real-time notification system
- **ChatMessage**: Socket.IO-based real-time chat
- **Translation**: i18n support for multi-language content
- **ScormPackage**: SCORM 1.2 and 2004 compliance support

**Critical Workflows**:
1. **User Registration → Login → Enroll → Learn**:
   - Entry: `POST /api/auth/register`
   - Auto-generates JWT tokens, stores refresh token in DB
   - Enrollment requires authentication, accepts courseId or slug

2. **Content Seed → Database Import**:
   - Entry: `python -m app.scripts.seed_base` in backend container
   - Course import via ZIP upload or content-importer service
   - Imports to SQLAlchemy via `db_importer.py`

3. **Code Lab Execution**:
   - Entry: `POST /execute` on executor service
   - Creates ephemeral Docker container, runs user code, validates against tests
   - Returns stdout/stderr and validation results

**External Integrations**:
- PostgreSQL: Primary datastore, managed via Prisma migrations
- Redis: Token blacklist, caching, session storage
- Docker Engine: Code execution sandbox (requires Docker socket mount)
- Email: Password reset + notifications via SMTP (Gmail default: redp41732@gmail.com)
- Socket.IO: WebSocket connections for real-time chat and notifications
- Content Importer: Dedicated Docker service for course content import from Markdown

**State Machines**:
- UserProgress: pending → in_progress → completed (tracked per module)
- ProjectSubmission: PENDING → REVIEWING → APPROVED/REJECTED
- Quiz attempts counter (max 3 attempts default)

## 6. DEVELOPMENT CONSTRAINTS

**Database Migrations**:
- NEVER edit `alembic/versions/*` directly
- Changes go through: edit SQLAlchemy models → `alembic revision --autogenerate -m "desc"` → `alembic upgrade head`

**Security Hardening**:
- JWT secrets MUST be 32+ characters (enforced by Pydantic validators)
- CORS origins configured via `CORS_ORIGINS` env var (JSON array)
- Rate limiting: slowapi with global middleware
- Security headers via custom FastAPI middleware

**Generated Code Paths**:
- `alembic/versions/` (migration files)
- `node_modules/` (frontend/executor dependencies)
- `__pycache__/` (Python bytecode)

**Docker Development Mode**:
- Backend uses volume mounts for hot reload (uvicorn --reload)
- Frontend uses Vite HMR
- Changes to `app/` auto-reload, changes to `pyproject.toml` require rebuild

## 7. QUICK REFERENCE

**Entry Points**:
- Backend: `/plataforma/backend-fastapi/app/main.py`
- Frontend: `/plataforma/frontend/src/main.tsx`
- Executor: `/plataforma/executor/src/server.ts`

**Configuration**:
- Environment: `/plataforma/.env` (copy from `.env.example`)
- Backend Config: `/plataforma/backend-fastapi/app/config.py`
- Database Models: `/plataforma/backend-fastapi/app/models/`
- Docker Services: `/plataforma/docker-compose.yml`

**Scripts**:
- Start platform: `docker-compose up -d` (or `make start`)
- Seed base data: `docker exec ciber-backend python -m app.scripts.seed_base`
- Migrations: `docker exec ciber-backend alembic upgrade head`
- Backend tests: `docker exec ciber-backend pytest`
- Logs: `docker logs ciber-backend --tail 50`

**Key Directories**:
- Backend routers: `/plataforma/backend-fastapi/app/routers/`
- Backend services: `/plataforma/backend-fastapi/app/services/`
- Backend middleware: `/plataforma/backend-fastapi/app/middleware/`
- Frontend pages: `/plataforma/frontend/src/pages/`
- Frontend components: `/plataforma/frontend/src/components/`
- Database seeds: `/plataforma/backend-fastapi/app/scripts/`

## 8. COMMON DEVELOPMENT TASKS

**Running the Platform**:
```bash
# Start all services (Postgres, Redis, Backend, Frontend, Executor)
docker-compose up -d

# Check service status
docker-compose ps

# View backend logs
docker logs ciber-backend -f

# Access backend shell
docker exec -it ciber-backend sh
```

**Database Operations**:
```bash
# Run migrations
docker exec ciber-backend alembic upgrade head

# Create new migration
docker exec ciber-backend alembic revision --autogenerate -m "description"

# Seed base data
docker exec ciber-backend python -m app.scripts.seed_base

# Access PostgreSQL shell
docker exec -it ciber-postgres psql -U ciber_admin -d ciber_platform
```

**Testing**:
```bash
# Backend tests
docker exec ciber-backend pytest

# Frontend tests (from host)
cd plataforma/frontend && npm test

# Test coverage
docker exec ciber-backend pytest --cov=app

# E2E tests with Playwright (via MCP)
# Use mcp__playwright__* tools for interactive testing
# IMPORTANT: Always clean up after Playwright tests
```

**Playwright Testing Cleanup (MANDATORY)**:
```bash
# ALWAYS run this command after finishing Playwright/MCP browser tests
rm -f *.png

# This removes all screenshot files generated during testing
# Screenshots are temporary evidence files and should NOT be committed
# Execute this cleanup IMMEDIATELY after completing browser testing sessions
```

**Adding New Features**:
1. **New API Endpoint**:
   - Create service in `backend-fastapi/app/services/`
   - Create router in `backend-fastapi/app/routers/`
   - Register router in `backend-fastapi/app/main.py`
   - Add auth dependencies as needed

2. **Database Schema Change**:
   - Edit SQLAlchemy models in `backend-fastapi/app/models/`
   - Run: `alembic revision --autogenerate -m "description"` then `alembic upgrade head`

3. **Frontend Page**:
   - Create page component in `frontend/src/pages/`
   - Add route in `frontend/src/App.tsx`
   - Create API service in `frontend/src/services/api/`
   - Use Zustand store for state management

**Port Configuration**:
- Frontend: 3000 (Vite dev server)
- Backend: 4000 (FastAPI/uvicorn)
- Executor: 5000 (Code execution service)
- PostgreSQL: 5433 (host) -> 5432 (container)
- Redis: 6380 (host) -> 6379 (container)
- Nginx: 80 (reverse proxy)

**Important Notes**:
- Backend uses uvicorn --reload for hot reload
- Frontend uses Vite HMR, changes reflect in <1 second
- Changes to `pyproject.toml` or `Dockerfile` require: `docker-compose up -d --build <service>`
- JWT tokens expire after 15 minutes; frontend auto-refreshes via `/api/auth/refresh`
- Course enrollment is idempotent: duplicate enrollment returns 200 with existing record

## 9. ADVANCED FEATURES

**Progressive Web App (PWA)**:
- Service worker configuration for offline support
- `PwaIndicators.tsx` component for installation prompts
- App manifest for mobile installation

**Internationalization (i18n)**:
- Translation model in database for multi-language content
- `translation.service.ts` for translation management
- `LanguageSelector.tsx` component for language switching
- Support for course content in multiple languages

**SCORM Compliance**:
- ScormPackage model for SCORM 1.2 and 2004 support
- `ScormUploader.tsx` component for package management
- Compatible with enterprise LMS systems

**Analytics & Reporting**:
- AnalyticsDashboard page with comprehensive metrics
- Export functionality for reports (CSV/PDF)
- EnrollmentChart, CompletionRateChart visualizations
- Analytics service with aggregated statistics

**Gamification System**:
- Badge achievements with UserBadge tracking
- XP/points system (fields in User model)
- BadgesShowcase, XPProgress components
- NotificationBell for real-time achievement notifications

**Real-Time Features**:
- Socket.IO chat system with course-specific rooms
- Real-time notifications via WebSocket
- ChatWidget component for in-app messaging
- Online presence indicators

## 10. API ENDPOINTS

**16 Route Groups** (21 services):
1. `/api/auth` - Authentication & authorization
2. `/api/users` - User management
3. `/api/courses` - Course CRUD & enrollment
4. `/api/modules` - Module management
5. `/api/lessons` - Lesson content
6. `/api/quizzes` - Quiz creation & attempts
7. `/api/labs` - Lab execution & submissions
8. `/api/projects` - Project submissions & review
9. `/api/progress` - Progress tracking
10. `/api/certificates` - Certificate generation
11. `/api/notifications` - Notification management
12. `/api/badges` - Badge system
13. `/api/admin` - Admin operations
14. `/api/training-profiles` - Training path management
15. `/api/analytics` - Analytics & reporting (commented out)
16. `/api/export` - Data export (commented out)

**Swagger Documentation**: Available at `/api-docs` when backend is running
