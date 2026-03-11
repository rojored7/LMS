# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. PROJECT IDENTITY

**Purpose**: Multi-course cybersecurity learning management system (LMS) with executable code labs, multi-profile training paths, and automated evaluation.

**Stack**: Node.js 20 + TypeScript 5, Express 4, React 18, Prisma ORM, PostgreSQL 15, Redis 7, Docker

**Type**: Microservices web platform (Backend API + Frontend SPA + Code Executor)

## 2. ARCHITECTURE PATTERNS

**Pattern**: Three-tier microservices with shared database
- Backend: Express REST API with layered architecture (routes → controllers → services → Prisma)
- Frontend: React SPA with component-based architecture (pages → components → hooks → services)
- Executor: Isolated Docker-based code execution service

**Entry Points**:
- Backend: `plataforma/backend/src/server.ts`
- Frontend: `plataforma/frontend/src/main.tsx`
- Executor: `plataforma/executor/src/server.ts`

**Core Packages**:
- Public API: `/api/auth`, `/api/courses`, `/api/users` (REST endpoints)
- Internal: `src/services/*` (business logic), `src/middleware/*` (auth, validation)
- Generated: `prisma/migrations/*`, `node_modules/*` (DO NOT MODIFY)

## 3. DETECTED CONVENTIONS

**Code Language**: Spanish in comments and UI strings, English for variable/function names (Mixed)

**Naming Patterns**:
- Files: kebab-case (`auth.service.ts`, `course.controller.ts`)
- TypeScript: PascalCase for types/interfaces, camelCase for functions/variables
- Routes: REST convention (`/api/courses/:id/enroll`)
- Database: snake_case for Prisma schema fields, camelCase in TypeScript

**Test Pattern**:
- Backend: Jest with `__tests__/` directory structure (44+ test files)
- Frontend: Vitest + React Testing Library (5 test files)
- E2E: Playwright (15 test specs implemented in /e2e)
- Test files: `*.test.ts` or `*.spec.ts`

## 4. HIDDEN COMPLEXITY

**Critical Middleware Chain (Backend)**:
- Global error handlers registered BEFORE routes: `handleUncaughtException()`, `handleUnhandledRejection()`
- Request flow: helmet → cors → compression → requestLogger → rateLimit → routes → errorHandler → notFoundHandler
- Authentication: Two middleware types exist:
  - `authenticate`: Required auth, throws 401 if no token
  - `optionalAuth`: Optional auth, validates token if present but doesn't throw error

**Route Resolution Order (CRITICAL)**:
- Specific routes MUST come before generic `:param` routes
- Example: `/enrolled` must be registered before `/:idOrSlug` or it will be interpreted as ID

**Prisma Connection Management**:
- Singleton pattern in `utils/prisma.ts` - do NOT create new PrismaClient instances
- Connection checked on startup, graceful shutdown on SIGTERM/SIGINT
- Database connection pooling handled automatically by Prisma

**Redis Connection**:
- Singleton in `utils/redis.ts`
- Used for: JWT token blacklist, session storage, caching
- Must configure password via `REDIS_PASSWORD` env var

**JWT Token Flow**:
- Access token: 15 minutes expiry (configured via `JWT_EXPIRES_IN` in .env)
- Refresh token: 7 days expiry, stored in database `refresh_tokens` table
- Token blacklist in Redis for logout/revocation
- Automatic token refresh via `/api/auth/refresh` endpoint

**Socket.IO Real-Time Features**:
- WebSocket integration in `backend/src/server.ts` and `backend/src/sockets/chat.socket.ts`
- Real-time chat messaging with room-based conversations
- Course-specific chat rooms for collaborative learning
- Connected on port 4000 alongside REST API

**Docker Executor Security**:
- Each code execution creates ephemeral Docker container
- Network disabled, resource limits enforced
- Timeout: 30 seconds default
- Sandboxed Alpine Linux image with Python/Node.js/Bash

**Configuration Loading Order**:
1. Environment variables from `.env` file
2. Docker Compose environment overrides
3. Default values in `src/config/index.ts`
4. Zod schema validation on startup

## 5. BUSINESS RULES

**Main Entities** (25 Prisma models + 6 enums):
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
   - Entry: `npm run seed:curso` in backend container
   - Reads Markdown course structure from root `01_Fundamentos_*` folders
   - Imports to Prisma via `seed-ciberseguridad.ts`

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
- NEVER edit `prisma/migrations/*` directly
- Changes go through: edit `schema.prisma` → `npm run migrate` → commit both
- Schema changes require container rebuild or manual `prisma generate`

**Security Hardening**:
- JWT secrets MUST be 32+ characters (enforced by Zod schema)
- CORS origins configured via `CORS_ORIGIN` env var (comma-separated)
- Rate limiting: 100 requests per 15 minutes per IP on `/api/` routes
- Helmet CSP: Allows `unsafe-inline` for styles only

**Generated Code Paths**:
- `node_modules/` (npm dependencies)
- `dist/` (TypeScript compilation output)
- `.prisma/client/` (Prisma generated types)
- Backend: Generated on `npm install` and `prisma generate`

**Docker Development Mode**:
- Backend/Frontend use volume mounts for hot reload (nodemon/Vite HMR)
- Changes to `src/` auto-reload, changes to `package.json` require rebuild
- Production mode: Multi-stage build with compiled assets only

**TypeScript Configuration**:
- Backend: `--transpileOnly` flag used in dev to skip type checking for speed
- Strict mode enabled, but uses `as any` escape hatch in `prisma.ts` for complex types
- Custom types extend Express Request via `src/types/express.d.ts`

## 7. QUICK REFERENCE

**Entry Points**:
- Backend: `/plataforma/backend/src/server.ts`
- Frontend: `/plataforma/frontend/src/main.tsx`
- Executor: `/plataforma/executor/src/server.ts`

**Configuration**:
- Environment: `/plataforma/.env` (copy from `.env.example`)
- Backend Config: `/plataforma/backend/src/config/index.ts`
- Prisma Schema: `/plataforma/backend/prisma/schema.prisma`
- Docker Services: `/plataforma/docker-compose.yml`

**Scripts**:
- Start platform: `docker-compose up -d` (or `make start`)
- Seed course: `docker exec ciber-backend npm run seed:curso`
- Migrations: `docker exec ciber-backend npm run migrate`
- Backend tests: `docker exec ciber-backend npm test`
- Logs: `docker logs ciber-backend --tail 50`

**Key Directories**:
- Backend routes: `/plataforma/backend/src/routes/`
- Backend services: `/plataforma/backend/src/services/`
- Backend middleware: `/plataforma/backend/src/middleware/`
- Frontend pages: `/plataforma/frontend/src/pages/`
- Frontend components: `/plataforma/frontend/src/components/`
- Database seeds: `/plataforma/backend/prisma/seed*.ts`
- Course content: Root level `01_Fundamentos_*` to `09_Proyecto_Final/`

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
docker exec ciber-backend npx prisma migrate dev

# Reset database (WARNING: deletes all data)
docker exec ciber-backend npx prisma migrate reset

# Seed cybersecurity course
docker exec ciber-backend npm run seed:curso

# Access PostgreSQL shell
docker exec -it ciber-postgres psql -U ciber_admin -d ciber_platform
```

**Testing**:
```bash
# Backend tests
docker exec ciber-backend npm test

# Frontend tests (from host)
cd plataforma/frontend && npm test

# Test coverage
docker exec ciber-backend npm run test:coverage

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
   - Create service in `src/services/*.service.ts`
   - Create controller in `src/controllers/*.controller.ts`
   - Add routes in `src/routes/*.routes.ts`
   - Register routes in `src/server.ts`
   - Copy files to container: `docker cp` or rebuild

2. **Database Schema Change**:
   - Edit `prisma/schema.prisma`
   - Run: `docker exec ciber-backend npx prisma migrate dev --name description`
   - Prisma auto-generates migration SQL and TypeScript types

3. **Frontend Page**:
   - Create page component in `src/pages/`
   - Add route in `src/App.tsx`
   - Create API service in `src/services/api/`
   - Use Zustand store for state management

**Port Configuration**:
- Frontend: 3000 (Vite dev server)
- Backend: 4000 (Express API)
- Executor: 5000 (Code execution service)
- PostgreSQL: 5433 (host) → 5432 (container)
- Redis: 6380 (host) → 6379 (container)
- Nginx: 80 (reverse proxy)

**Important Notes**:
- Backend uses nodemon for auto-reload, changes to `src/` reflect immediately
- Frontend uses Vite HMR, changes reflect in <1 second
- Changes to `package.json` or `Dockerfile` require: `docker-compose up -d --build <service>`
- JWT tokens expire after 15 minutes; frontend auto-refreshes via `/api/auth/refresh`
- Course enrollment is idempotent: duplicate enrollment returns 200 with existing record (not 500 error)

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
