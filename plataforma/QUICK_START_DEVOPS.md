# Quick Start - DevOps Guide

## TL;DR - What Was Done

✅ **Docker Executor** - Fully working, tested
✅ **Database Migrations** - Applied (gamification + executor fields)
✅ **PDF Service** - Certificate generation ready
✅ **Storage Service** - File uploads ready
✅ **Deployment Scripts** - Production-ready
✅ **Production Docker Compose** - Configured

## Quick Commands

### Test Docker Executor

```bash
cd plataforma/executor
npm test
```

### Check Database Schema

```bash
docker exec ciber-backend npx prisma studio
# Open http://localhost:5555
```

### Create Database Backup

```bash
cd plataforma
./scripts/backup-db.sh
```

### Deploy to Production

```bash
cd plataforma

# 1. Configure environment
cp .env.production.example .env
# Edit .env with your values

# 2. Deploy
chmod +x scripts/*.sh
./scripts/deploy.sh docker-compose.prod.yml
```

## New Services Usage

### PDF Service (Certificates)

```typescript
import { pdfService } from './services/pdf.service';

// Generate certificate
const url = await pdfService.generateCertificate({
  userName: 'Juan Pérez',
  courseName: 'Fundamentos de Ciberseguridad',
  completionDate: new Date(),
  certificateId: 'cert-12345',
});

// URL: /certificates/cert-12345.pdf
```

### Storage Service (File Uploads)

```typescript
import { storageService } from './services/storage.service';

// In route
const upload = storageService.getProjectStorage();

router.post('/projects/:id/submit',
  authenticate,
  upload.array('files', 10),
  async (req, res) => {
    const files = req.files as Express.Multer.File[];
    const metadata = files.map(f => storageService.getFileMetadata(f));
    // Save metadata to database
  }
);
```

### Docker Executor (Code Execution)

```typescript
// Already integrated in executor service
// Call from backend:

const response = await fetch('http://executor:5000/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'print("Hello")',
    language: 'python',
    tests: [
      {
        expectedOutput: 'Hello',
        type: 'exact',
        description: 'Should print Hello',
      },
    ],
  }),
});

const result = await response.json();
// result.success, result.result.passed, result.result.stdout
```

## Database Schema - New Tables

### badges
```sql
id, name, slug, description, icon, color, xpReward, createdAt
```

### user_badges
```sql
id, userId, badgeId, awardedAt
```

### notifications
```sql
id, userId, type, title, message, read, data, createdAt
```

### Users - New Field
```sql
xp INTEGER DEFAULT 0
```

### lab_submissions - New Fields
```sql
language, stdout, stderr, exitCode, executionTime, feedback
```

### project_submissions - New Fields
```sql
description, score, reviewedBy, reviewedAt, updatedAt
```

## Environment Variables Added

```bash
# PDF Service (uses built-in paths)
# No additional env vars needed

# Storage Service
# Uses ./uploads directory

# Executor
SANDBOX_TIMEOUT=30000
SANDBOX_MEMORY_LIMIT=256m
SANDBOX_CPU_LIMIT=1
SANDBOX_NETWORK_DISABLED=true
```

## Health Checks

```bash
# Backend
curl http://localhost:4000/health

# Executor
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000

# Database
docker exec ciber-postgres pg_isready -U ciber_admin
```

## Logs

```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend

# Follow new logs
docker-compose logs -f --tail=0 backend
```

## Troubleshooting

### Migration Failed

```bash
# Check migration status
docker exec ciber-backend npx prisma migrate status

# If stuck, resolve manually
docker exec ciber-backend npx prisma migrate resolve --applied <migration-name>

# Or reset (DANGER: deletes data)
docker exec ciber-backend npx prisma migrate reset
```

### Executor Not Working

```bash
# Check if sandbox image exists
docker images | grep ciber-sandbox

# Build sandbox image
cd plataforma/executor
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .

# Test executor
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -d '{"code":"print(1+1)", "language":"python"}'
```

### PDF Generation Not Working

```bash
# Check if public directory exists
ls -la plataforma/backend/public/certificates

# Create if missing
mkdir -p plataforma/backend/public/certificates

# Check permissions
chmod 755 plataforma/backend/public/certificates
```

### File Upload Not Working

```bash
# Check if uploads directory exists
ls -la plataforma/backend/uploads

# Create if missing
mkdir -p plataforma/backend/uploads/{projects,avatars,temp}

# Check permissions
chmod 755 plataforma/backend/uploads
```

## Integration Examples

### Complete Lab Submission Flow

```typescript
// 1. Student submits code
router.post('/labs/:id/submit', authenticate, async (req, res) => {
  const { code } = req.body;
  const labId = req.params.id;
  const userId = req.user.userId;

  // Get lab details
  const lab = await prisma.lab.findUnique({ where: { id: labId } });

  // Execute code
  const result = await fetch('http://executor:5000/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      language: lab.language,
      tests: lab.tests,
      timeout: 30000,
    }),
  }).then(r => r.json());

  // Save submission
  const submission = await prisma.labSubmission.create({
    data: {
      userId,
      labId,
      code,
      language: lab.language,
      stdout: result.result.stdout,
      stderr: result.result.stderr,
      exitCode: result.result.exitCode,
      executionTime: result.result.executionTime,
      passed: result.result.passed,
      feedback: generateFeedback(result.result),
    },
  });

  // Award XP if passed
  if (submission.passed) {
    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: 50 } },
    });

    // Check for badge
    await checkAndAwardBadges(userId);
  }

  res.json({ success: true, submission });
});
```

### Complete Certificate Generation Flow

```typescript
// When course is completed
router.post('/courses/:id/complete', authenticate, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user.userId;

  // Check if really completed
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { course: true, user: true },
  });

  const progress = await calculateCourseProgress(userId, courseId);

  if (progress < 100) {
    return res.status(400).json({ error: 'Course not completed' });
  }

  // Generate certificate
  const certificateId = generateCertificateId();
  const url = await pdfService.generateCertificate({
    userName: enrollment.user.name,
    courseName: enrollment.course.title,
    completionDate: new Date(),
    certificateId,
  });

  // Save certificate
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      certificateUrl: url,
      verificationCode: certificateId,
      emailSent: false,
    },
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'CERTIFICATE_ISSUED',
      title: 'Certificado emitido',
      message: `Tu certificado para ${enrollment.course.title} está listo`,
      data: { certificateId: certificate.id },
    },
  });

  // Award completion badge
  const badge = await prisma.badge.findUnique({
    where: { slug: 'course-completed' },
  });

  if (badge) {
    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
  }

  res.json({ success: true, certificate, url });
});
```

## Files Created/Modified

### New Files
```
plataforma/
├── backend/src/services/
│   ├── pdf.service.ts
│   └── storage.service.ts
├── executor/src/__tests__/
│   └── dockerExecutor.test.ts
├── scripts/
│   ├── deploy.sh
│   ├── backup-db.sh
│   └── restore-db.sh
├── docker-compose.prod.yml
├── .env.production.example
├── INFRASTRUCTURE.md
├── INFRASTRUCTURE_SETUP_COMPLETE.md
└── QUICK_START_DEVOPS.md
```

### Modified Files
```
plataforma/
├── backend/prisma/
│   ├── schema.prisma (updated)
│   └── migrations/20260304131719_add_gamification_and_executor_fields/
│       └── migration.sql
└── backend/package.json (added pdfkit, multer)
```

## That's It!

Everything is set up and ready. The development team can now:

1. Implement controllers and routes using the new services
2. Build UI components for new features
3. Deploy to production when ready

**Questions?** Check `INFRASTRUCTURE.md` for detailed documentation.

---

**Setup by:** Claude (AI DevOps Engineer)
**Date:** 2026-03-04
**Status:** ✅ COMPLETE
