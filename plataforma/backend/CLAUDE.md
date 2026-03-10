# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 1. PROJECT IDENTITY

**Purpose**: REST API backend for cybersecurity multi-course LMS with JWT authentication, role-based access control, and code execution integration.

**Stack**: Node.js 20, TypeScript 5.3, Express 4.18, Prisma 5.9 (PostgreSQL 15), Redis 7 (ioredis), JWT, Winston, Zod.

**Type**: REST API with layered architecture running in Docker containers.

## 2. ARCHITECTURE PATTERNS

**Pattern**: Three-tier Express layered architecture (Routes → Controllers → Services → Prisma ORM).

**Entry points**:
- Main: `src/server.ts` (Express app initialization and middleware chain)
- Routes: `src/routes/*.routes.ts` (API endpoint definitions)
- Controllers: `src/controllers/*.controller.ts` (HTTP request/response handling)

**Core packages**:
- Public API: `/api/auth`, `/api/courses`, `/api/users` (REST endpoints with JSON responses)
- Internal: `src/services/*.service.ts` (business logic layer), `src/middleware/*.ts` (auth, logging, errors), `src/utils/prisma.ts` and `src/utils/redis.ts` (singleton DB/cache clients)
- Generated: `prisma/migrations/*` (NEVER edit), `node_modules/*`, `dist/*`, `.prisma/client/*` (auto-generated on `prisma generate`)

## 3. DETECTED CONVENTIONS

**Code language**: Spanish for comments/UI strings, English for code identifiers (Mixed bilingual style).

**Naming patterns**:
- Files: kebab-case (`auth.service.ts`, `course.controller.ts`, `user.routes.ts`)
- Classes/Interfaces: PascalCase (`CourseService`, `AuthenticationError`, `JwtPayload`)
- Functions/Variables: camelCase (`getUserEnrollments`, `isBlacklisted`, `courseId`)
- Database schema: snake_case in Prisma schema, camelCase in TypeScript generated client
- Routes: REST-style (`/api/courses/:id/enroll`, `/api/auth/refresh`)

**Test pattern**: Jest framework with `__tests__/` directory structure, `*.test.ts` naming, run via `npm test` in Docker container.

## 4. HIDDEN COMPLEXITY

**Middleware Execution Order (CRITICAL)**:
- Global error handlers registered FIRST: `handleUncaughtException()`, `handleUnhandledRejection()` in server.ts:43-44
- Request processing chain: helmet → cors → body parsers → cookieParser → compression → requestLogger → rateLimiter → routes → notFoundHandler → errorHandler
- Middleware must follow this sequence or security/logging breaks

**Authentication Middleware Types**:
- `authenticate`: Required auth, throws 401 if missing/invalid token, verifies against blacklist + DB user existence
- `authenticateOptional`: Validates token if present but continues without error if missing/invalid
- `optionalAuth`: Duplicate middleware (inconsistency - uses different req.user field names)

**Route Resolution Order (CRITICAL - Bug-Prone)**:
- Specific routes MUST be registered BEFORE generic `:param` routes
- Example in course.routes.ts: `/enrolled` at line 14 BEFORE `/:idOrSlug` at line 27
- Violation causes Express to match parameter route first, treating literal path as parameter value

**JWT Token Lifecycle**:
- Access token: Configured via `JWT_EXPIRES_IN` env (default 15m), stored only client-side
- Refresh token: Configured via `JWT_REFRESH_EXPIRES_IN` (default 7d), stored in `refresh_tokens` table with expiry
- Blacklist in Redis: Token added to `blacklist:{token}` key with TTL equal to remaining token life
- Mass invalidation: `user:{userId}:tokens_invalidated` timestamp key for password changes

**Token Validation Flow (5 Security Checks)**:
1. Check Redis blacklist (`tokenService.isBlacklisted`)
2. Verify JWT signature and expiry (`jwt.verify`)
3. Validate payload completeness (userId, email, role required)
4. Check mass invalidation timestamp (`tokenService.areUserTokensInvalidated`)
5. Verify user still exists in database (`prisma.user.findUnique`)

**Prisma Client Singleton Pattern**:
- Global singleton in `utils/prisma.ts` prevents connection pool exhaustion
- NEVER create `new PrismaClient()` elsewhere - always import `{ prisma }` from utils
- Development mode: Reuses global.prisma across hot-reloads
- Production mode: Single instance per process

**Redis Connection Management**:
- Singleton client with lazy connection in `utils/redis.ts`
- Exponential backoff retry strategy: 50ms → 100ms → 200ms up to 2000ms (max 10 retries)
- Process signal handlers (SIGTERM/SIGINT) trigger graceful disconnection
- All cache operations fail-closed: errors return `null` or `true` (reject) for security

**Configuration Loading Priority**:
1. `.env` file loaded via dotenv (or `.env.test` if `NODE_ENV=test`)
2. Environment variables parsed and validated by Zod schema in `src/config/index.ts`
3. Default values applied only if env var missing
4. Invalid config terminates process with error code 1

**Course Enrollment Idempotency**:
- Duplicate enrollment does NOT throw error (changed in course.service.ts:233-256)
- Returns existing enrollment with 200 status instead of 500 error
- Unique constraint at DB level: `@@unique([userId, courseId])` in enrollments table

## 5. BUSINESS RULES

**Main entities**:
- User: Three roles (ADMIN, INSTRUCTOR, STUDENT) with unique email, bcrypt password hash, optional trainingProfileId for learning paths
- Course: Published/draft state, supports lookup by `id` OR `slug` (dual identifier pattern in service layer)
- Enrollment: Unique per (userId, courseId), tracks progress and completion timestamp, idempotent creation
- Module/Lesson: Ordered content hierarchy (course → modules[order] → lessons[order]) with progress tracking per user
- Quiz/Lab: Auto-graded assessments with attempt limits, stored as JSON test definitions

**Critical workflows**:
1. **Auth flow**: POST /auth/register → auto-login → returns access + refresh tokens → store refresh in DB + Redis blacklist ready
2. **Enrollment**: POST /courses/:id/enroll → checks auth → verifies course published → idempotent insert → returns enrollment with course data
3. **Token refresh**: POST /auth/refresh → validates refresh token from DB → issues new access token → rotates refresh token

**External integrations**:
- PostgreSQL: Primary datastore via Prisma ORM (connection pooling automatic)
- Redis: JWT blacklist + cache (required - app won't start without connection)
- Docker Engine: Code executor service (separate container at EXECUTOR_SERVICE_URL)
- Email SMTP: Optional password reset (Gmail default via nodemailer)

**State machines**:
- UserProgress: pending → in_progress → completed (per module)
- ProjectSubmission: PENDING → REVIEWING → APPROVED|REJECTED (instructor review cycle)
- Quiz attempts: Counter increments until max attempts reached (default 3)

## 6. DEVELOPMENT CONSTRAINTS

**Database Migration Rules**:
- NEVER manually edit files in `prisma/migrations/*` directory
- Workflow: Edit `schema.prisma` → `npm run migrate` (creates migration + applies) → commit both schema and migration files
- Schema changes require `prisma generate` to update TypeScript types (auto-runs after migrate)

**Security Requirements**:
- JWT secrets MUST be ≥32 characters (enforced by Zod schema validation at startup)
- CORS origins: Configured via `CORS_ORIGIN` env var (comma-separated list)
- Rate limiting: 100 requests per 15 minutes per IP on `/api/*` routes (configurable via env)
- Helmet CSP: Allows `unsafe-inline` for styles only (strictest possible without breaking frontend)

**Generated Code Paths (DO NOT EDIT)**:
- `node_modules/` (npm dependencies)
- `dist/` (TypeScript compilation output)
- `.prisma/client/` (Prisma generated TypeScript types)
- `prisma/migrations/*` (auto-generated SQL)

**TypeScript Configuration**:
- Strict mode enabled with all checks (noImplicitAny, strictNullChecks, etc.)
- Path aliases configured: `@/`, `@config/`, `@controllers/`, `@middleware/`, `@services/`, `@utils/`, `@validators/`
- Development: Uses `--transpileOnly` flag to skip type checking for faster iteration
- Production: Full type check via `npm run type-check` before build

**Docker Development Mode**:
- Hot reload: nodemon watches `src/**/*.ts` for changes, auto-restarts on save
- Volume mounts: `./src` → container ensures changes reflect immediately
- Changes to `package.json` or `Dockerfile` require: `docker-compose up -d --build backend`

## 7. QUICK REFERENCE

**Entry Point**:
- `/plataforma/backend/src/server.ts`

**Configuration**:
- Environment: `/plataforma/.env` (copy from `.env.example`)
- Backend config: `/plataforma/backend/src/config/index.ts` (Zod validation)
- Prisma schema: `/plataforma/backend/prisma/schema.prisma`

**Key Scripts** (run in Docker container via `docker exec ciber-backend <command>`):
- `npm run dev` - Start with hot reload (nodemon + ts-node)
- `npm run build` - Compile TypeScript to dist/
- `npm test` - Run Jest tests
- `npm run migrate` - Create and apply Prisma migration
- `npm run seed:curso` - Seed cybersecurity course from Markdown files
- `npx prisma studio` - Open Prisma GUI for database

**Key Directories**:
- Routes: `/plataforma/backend/src/routes/`
- Controllers: `/plataforma/backend/src/controllers/`
- Services: `/plataforma/backend/src/services/`
- Middleware: `/plataforma/backend/src/middleware/`
- Database seeds: `/plataforma/backend/prisma/seed*.ts`

## 8. COMMON DEVELOPMENT TASKS

**Running Commands** (from host machine):
```bash
# Access backend shell
docker exec -it ciber-backend sh

# View logs
docker logs ciber-backend -f

# Run migrations
docker exec ciber-backend npm run migrate

# Seed course data
docker exec ciber-backend npm run seed:curso

# Run tests
docker exec ciber-backend npm test

# Type check
docker exec ciber-backend npm run type-check
```

**Database Operations**:
```bash
# Create migration after schema change
docker exec ciber-backend npx prisma migrate dev --name add_user_avatar

# Reset database (CAUTION: deletes all data)
docker exec ciber-backend npx prisma migrate reset

# View database in GUI
docker exec ciber-backend npx prisma studio
# Then open http://localhost:5555 in browser
```

**Adding New Endpoints**:
1. Create service method in `src/services/*.service.ts` (business logic)
2. Create controller function in `src/controllers/*.controller.ts` (HTTP handling)
3. Add route in `src/routes/*.routes.ts` (apply middleware: authenticate, authorize, validators)
4. Register route in `src/server.ts` if new router file
5. Changes reflect immediately via nodemon (no rebuild needed)

**Database Schema Changes**:
```bash
# 1. Edit prisma/schema.prisma
# 2. Run migration
docker exec ciber-backend npx prisma migrate dev --name description_of_change
# 3. Prisma auto-generates TypeScript types
# 4. Commit both schema.prisma and new migration file
```

**Important Notes**:
- Port mappings: Backend 4000 (container) → 4000 (host), PostgreSQL 5432 → 5433, Redis 6379 → 6380
- Environment variables override: Docker Compose > .env file > config defaults
- Route order matters: Specific paths before parameterized paths (see course.routes.ts:11-14)
- Enrollment is idempotent: Duplicate enrollments return existing record with 200, not 500
- Two auth middlewares exist: `authenticate` (strict) and `optionalAuth` (lenient) - verify field names in req.user
