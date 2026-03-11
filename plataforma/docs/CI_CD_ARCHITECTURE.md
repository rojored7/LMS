# 🏗️ CI/CD Architecture - Plataforma Ciber

**Versión:** 1.0.0
**Patrón:** Blue-Green Deployment con Zero-Downtime
**Última Actualización:** Marzo 2026

---

## 📐 Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB REPOSITORY                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │   Backend   │  │   Frontend   │  │   Executor         │    │
│  │   (TS/Node) │  │   (React)    │  │   (TS/Node/Docker) │    │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘    │
└─────────┼─────────────────┼───────────────────┼────────────────┘
          │                 │                   │
          └─────────────────┴───────────────────┘
                            │
                     ┌──────▼──────┐
                     │   PUSH TO   │
                     │    MAIN     │
                     └──────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
  ┌─────▼──────┐   ┌────────▼────────┐   ┌─────▼────────┐
  │   CI.YML   │   │ SECURITY-SCAN   │   │  SCHEDULED   │
  │            │   │     .YML        │   │  BACKUP.YML  │
  │ - Lint     │   │                 │   │              │
  │ - Tests    │   │ - npm audit     │   │ - Daily DB   │
  │ - E2E      │   │ - Trivy scan    │   │   backup     │
  └─────┬──────┘   │ - CodeQL        │   └──────────────┘
        │          │ - Secret scan   │
        │ PASS     └─────────────────┘
        │
  ┌─────▼────────────────┐
  │  DEPLOY-PROD.YML     │
  │                      │
  │ 1. Reuse CI tests    │
  │ 2. Build images      │
  │ 3. Push to GHCR      │
  │ 4. SSH to server     │
  │ 5. Blue-green deploy │
  └───────┬──────────────┘
          │
          │ SSH
          │
  ┌───────▼──────────────────────────────────────────┐
  │          PRODUCTION SERVER                       │
  │                                                   │
  │  ┌─────────────────────────────────────────┐    │
  │  │  blue-green-deploy.sh                   │    │
  │  │                                          │    │
  │  │  1. Detect current environment           │    │
  │  │  2. Create DB backup                     │    │
  │  │  3. Pull images from GHCR                │    │
  │  │  4. Run safe migrations                  │    │
  │  │  5. Start new environment                │    │
  │  │  6. Health checks + Smoke tests          │    │
  │  │  7. Switch nginx traffic                 │    │
  │  │  8. Monitor for errors                   │    │
  │  │  9. Drain old environment                │    │
  │  │ 10. Cleanup                              │    │
  │  └──────────────┬───────────────────────────┘    │
  │                 │                                 │
  │     ┌───────────▼────────────┐                   │
  │     │   NGINX REVERSE PROXY   │                   │
  │     │   (Dynamic upstream)    │                   │
  │     └───────────┬────────────┘                   │
  │                 │                                 │
  │    ┌────────────┴─────────────┐                  │
  │    │                          │                  │
  │ ┌──▼───────┐         ┌────────▼──┐              │
  │ │   BLUE   │         │   GREEN   │              │
  │ │          │         │           │              │
  │ │ :4000    │         │ :4001     │              │
  │ │ :5000    │         │ :5001     │              │
  │ │ :3000    │         │ :3001     │              │
  │ └──┬───┬───┘         └───┬───┬───┘              │
  │    │   │                 │   │                  │
  │    └───┴─────────────────┴───┘                  │
  │            │           │                        │
  │     ┌──────▼──────┐  ┌▼─────────┐              │
  │     │  PostgreSQL │  │  Redis   │              │
  │     │  (Shared)   │  │ (Shared) │              │
  │     └─────────────┘  └──────────┘              │
  │                                                 │
  │  ┌─────────────────────────────────────┐       │
  │  │  MONITORING STACK                   │       │
  │  │  - Prometheus (metrics)              │       │
  │  │  - Grafana (dashboards)              │       │
  │  │  - Alertmanager (alerts)             │       │
  │  └─────────────────────────────────────┘       │
  │                                                 │
  │  ┌─────────────────────────────────────┐       │
  │  │  BACKUP SYSTEM                       │       │
  │  │  - Cron service (daily backups)      │       │
  │  │  - Cloud upload (S3/Azure/GCS)       │       │
  │  └─────────────────────────────────────┘       │
  └─────────────────────────────────────────────────┘
```

---

## 🔄 Workflow CI/CD Completo

### 1. Continuous Integration (.github/workflows/ci.yml)

**Trigger:** Push, Pull Request

```yaml
┌─────────────────────────────────────────────────────┐
│  JOB: lint-and-typecheck                            │
│  ✓ ESLint backend                                   │
│  ✓ ESLint frontend                                  │
│  ✓ TypeScript check backend                         │
│  ✓ TypeScript check frontend                        │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOB: backend-tests                                 │
│  Services: PostgreSQL 15, Redis 7                   │
│  ✓ npm install                                      │
│  ✓ Prisma migrate deploy                            │
│  ✓ Run 44 unit tests                                │
│  ✓ Coverage threshold: 70%                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOB: frontend-tests                                │
│  ✓ npm install                                      │
│  ✓ Run 5 component tests                            │
│  ✓ Coverage threshold: 70%                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOB: e2e-tests                                     │
│  Services: Full docker-compose stack                │
│  ✓ npm install                                      │
│  ✓ Run 15 Playwright specs                          │
│  ✓ Upload test results                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOB: security-scan                                 │
│  ✓ npm audit (backend, frontend, executor)          │
│  ✓ Trivy container scan                             │
│  ✓ Fail on CRITICAL or HIGH vulnerabilities         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  JOB: all-tests-passed                              │
│  Needs: [lint, backend-tests, frontend-tests, e2e]  │
│  ✓ Gate para deployment                             │
└─────────────────────────────────────────────────────┘
```

**Resultado:** ✅ PASS → Permitir deployment
**Resultado:** ❌ FAIL → Bloquear deployment

---

### 2. Continuous Deployment (.github/workflows/deploy-production.yml)

**Trigger:** Manual (workflow_dispatch)

```yaml
┌─────────────────────────────────────────────────────┐
│  STEP 1: Reuse CI Workflow                          │
│  uses: ./.github/workflows/ci.yml                   │
│  ✓ Evita duplicación de tests                       │
└─────────────────────────────────────────────────────┘
                       │
                       ├── PASS
                       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 2: Build Docker Images                        │
│  ✓ Backend (multi-stage build)                      │
│  ✓ Frontend (nginx static serve)                    │
│  ✓ Executor (Docker-in-Docker)                      │
│  Cache: BuildKit cache layers                       │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 3: Security Scan with Trivy                   │
│  ✓ Scan each image                                  │
│  ✓ Upload SARIF to GitHub Security                  │
│  ✓ Fail on CRITICAL vulnerabilities                 │
└─────────────────────────────────────────────────────┘
                       │
                       ├── PASS
                       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 4: Push to GitHub Container Registry          │
│  Tag: ghcr.io/org/plataforma/backend:sha-abc123     │
│  Tag: ghcr.io/org/plataforma/backend:latest         │
│  ✓ Login to GHCR                                    │
│  ✓ Push images                                      │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 5: Deploy to Production Server                │
│  via SSH: appleboy/ssh-action@master                │
│                                                      │
│  Commands:                                           │
│    cd /opt/plataforma                                │
│    git pull origin main                              │
│    export $(cat .env | xargs)                        │
│    ./scripts/blue-green-deploy.sh --env=production  │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 6: Health Checks                              │
│  ✓ /api/health                                      │
│  ✓ /api/health/ready                                │
│  ✓ Timeout: 5 minutos                               │
└─────────────────────────────────────────────────────┘
                       │
                       ├── SUCCESS
                       │
┌─────────────────────────────────────────────────────┐
│  STEP 7: Notify Deployment                          │
│  ✓ Slack notification                               │
│  ✓ GitHub deployment status                         │
└─────────────────────────────────────────────────────┘
```

---

### 3. Blue-Green Deployment (scripts/blue-green-deploy.sh)

**13 Pasos con Protección Total:**

```bash
PASO 1: Validate Prerequisites
├─ Docker, docker-compose instalados
├─ Variables de entorno configuradas
└─ Permisos correctos

PASO 2: Detect Active Environment
├─ Verificar containers corriendo
├─ Leer upstream.conf de nginx
└─ Determinar: blue | green | none

PASO 3: Create Pre-Deployment Backup
├─ pg_dump de PostgreSQL
├─ Guardar metadata (users, courses, enrollments)
└─ Estado en .deployment-state/pre-deployment-state.json

PASO 4: Pull New Docker Images
├─ docker pull ghcr.io/.../backend:sha-abc123
├─ docker pull ghcr.io/.../frontend:sha-abc123
└─ docker pull ghcr.io/.../executor:sha-abc123

PASO 5: Run Database Migrations
├─ Ejecutar: ./scripts/safe-migrate.sh
│  ├─ Backup pre-migración
│  ├─ Preview de cambios
│  ├─ Aplicar migraciones
│  ├─ Validar integridad
│  └─ Rollback automático si falla
└─ Regenerar Prisma Client

PASO 6: Start New Environment
├─ docker-compose -f docker-compose.{green|blue}.yml up -d
├─ Esperar start_period (30s)
└─ Verificar containers healthy

PASO 7: Health Checks
├─ Retry: 30 intentos × 2 segundos
├─ /health → "healthy"
└─ /health/ready → "ready" (DB + Redis)

PASO 8: Smoke Tests
├─ Test 1: POST /api/auth/register
├─ Test 2: POST /api/auth/login
├─ Test 3: GET /api/courses (con JWT)
└─ Test 4: Cleanup (delete test user)

PASO 9: Validate Data Integrity
├─ Comparar COUNT(*) users antes/después
├─ Comparar COUNT(*) enrollments
└─ FAIL si cualquier tabla perdió registros
   → Trigger automatic rollback

PASO 10: Switch Nginx Traffic
├─ Generar nuevo upstream.conf
├─ nginx -t (test config)
└─ nginx -s reload (0 downtime)

PASO 11: Monitor New Environment
├─ Tail logs por 60 segundos
├─ Contar errores (threshold: 5)
└─ Rollback si > 5 errores

PASO 12: Stop Old Environment
├─ Esperar 60s (drain connections)
└─ docker-compose down (old environment)

PASO 13: Cleanup
├─ Eliminar backups antiguos (> 7 días)
└─ docker image prune (imágenes viejas)
```

**Protecciones Automáticas:**

- ✅ Rollback automático en CUALQUIER fallo
- ✅ Data integrity validation
- ✅ Zero data loss guarantee
- ✅ Zero downtime guarantee
- ✅ Error threshold monitoring

---

## 🔐 Security Scanning (.github/workflows/security-scan.yml)

**Trigger:** Push, Pull Request, Cron (diario 2 AM)

```
┌─────────────────┐   ┌─────────────────┐   ┌────────────────┐
│   NPM AUDIT     │   │  TRIVY SCAN     │   │    CODEQL      │
│                 │   │                 │   │                │
│ - backend       │   │ - Container     │   │ - JavaScript   │
│ - frontend      │   │   images        │   │   SAST         │
│ - executor      │   │ - OS packages   │   │ - Security     │
│                 │   │ - Vulnerabilities│   │   patterns     │
│ Fail on:        │   │                 │   │                │
│ CRITICAL, HIGH  │   │ Fail on:        │   │                │
└─────────────────┘   │ CRITICAL, HIGH  │   └────────────────┘
                      └─────────────────┘
         │                    │                     │
         └────────────────────┴─────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │  SECURITY SUMMARY     │
                  │                       │
                  │  Upload to:           │
                  │  - GitHub Security    │
                  │  - Artifacts          │
                  │  - SARIF reports      │
                  └───────────────────────┘
```

---

## 💾 Backup System

### Automated Backups (docker-compose.backup.yml)

```
┌─────────────────────────────────────────────────┐
│  CRON SERVICE (ciber-backup-cron)               │
│                                                 │
│  Schedule:                                      │
│  ─────────────────────────────────────────      │
│  0 2 * * *    → Full backup (diario 2 AM)      │
│  0 */6 * * *  → DB only (cada 6h)              │
│  0 4 * * 0    → Cleanup (domingos 4 AM)        │
│  0 5 * * 0    → Verify (domingos 5 AM)         │
│                                                 │
│  Process:                                       │
│  ─────────────────────────────────────────      │
│  1. pg_dump PostgreSQL → .sql.gz                │
│  2. Redis BGSAVE → dump.rdb.gz                  │
│  3. Docker volumes → .tar.gz                    │
│  4. Upload to cloud (S3/Azure/GCS)              │
│  5. Cleanup old backups (> 30 días)             │
└─────────────────────────────────────────────────┘
```

### GitHub Actions Backup (Redundancy)

```
┌─────────────────────────────────────────────────┐
│  SCHEDULED-BACKUP.YML                           │
│  (Redundancia independiente del servidor)       │
│                                                 │
│  Trigger: Cron diario 3 AM UTC                  │
│                                                 │
│  Steps:                                         │
│  1. SSH to production server                    │
│  2. Execute backup script                       │
│  3. Download backup via SCP                     │
│  4. Upload to GitHub Artifacts (90 días)        │
│  5. Upload to S3 (redundancy)                   │
│  6. Verify integrity                            │
│  7. Notify on failure                           │
└─────────────────────────────────────────────────┘
```

---

## 📊 Monitoring Stack

```
┌──────────────────────────────────────────────────────────┐
│                     PROMETHEUS                           │
│                  (Metrics Collection)                    │
│                                                          │
│  Scrape Targets:                                        │
│  ├─ backend-api:4000/metrics (15s interval)             │
│  ├─ executor:5000/metrics                               │
│  ├─ node-exporter:9100 (system metrics)                 │
│  ├─ postgres-exporter:9187 (DB metrics)                 │
│  ├─ redis-exporter:9121 (cache metrics)                 │
│  └─ cadvisor:8080 (container metrics)                   │
│                                                          │
│  Retention: 30 días                                     │
│  Storage: prometheus_data volume                        │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────┴──────────┬──────────────┐
         │                      │              │
         ▼                      ▼              ▼
┌─────────────────┐   ┌─────────────────┐   ┌──────────────┐
│    GRAFANA      │   │  ALERTMANAGER   │   │   ALERTS     │
│   (Dashboards)  │   │   (Routing)     │   │   (Rules)    │
│                 │   │                 │   │              │
│ - Overview      │   │ Routes:         │   │ - CPU        │
│ - Application   │   │ ├─ Critical     │   │ - Memory     │
│ - Database      │   │ │  → Slack +    │   │ - DB Down    │
│ - Performance   │   │ │    Email      │   │ - Errors     │
│                 │   │ ├─ Database     │   │ - Response   │
│ Auto-refresh:   │   │ │  → DBA team   │   │   time       │
│ 30s             │   │ └─ Security     │   │              │
│                 │   │    → Sec team   │   │              │
└─────────────────┘   └─────────────────┘   └──────────────┘
```

---

## 🔄 Rollback Strategies

### 1. Automatic Rollback (during deployment)

```
Triggers:
├─ Health check failure
├─ Smoke test failure
├─ Data integrity check failure
└─ Error threshold exceeded (> 5 errors in 60s)

Process:
1. Detect failure
2. Switch nginx back to old environment
3. Stop new (failed) environment
4. Optional: Restore DB from backup
5. Notify team
```

### 2. Manual Rollback (./scripts/rollback.sh)

```bash
# Interactive mode
./scripts/rollback.sh
# → Prompts for confirmation
# → Asks about DB restore

# Automatic mode (CI/CD)
./scripts/rollback.sh --auto
# → No prompts
# → Does NOT restore DB automatically

# To specific environment
./scripts/rollback.sh --to=blue
```

---

## 🎯 Key Metrics & SLIs

**Service Level Indicators:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| **Uptime** | 99.9% | < 99.5% |
| **Response Time (P95)** | < 500ms | > 2s |
| **Error Rate** | < 0.1% | > 1% |
| **Deployment Frequency** | Daily | - |
| **Deployment Success Rate** | > 95% | < 90% |
| **Mean Time to Recovery (MTTR)** | < 1h | > 2h |
| **Backup Success Rate** | 100% | < 100% |

---

## 📚 Archivos Clave del Sistema

```
plataforma/
├── .github/workflows/
│   ├── ci.yml                      # Tests automáticos
│   ├── deploy-production.yml       # Deployment pipeline
│   ├── security-scan.yml           # Security scanning
│   └── scheduled-backup.yml        # Backup redundante
│
├── scripts/
│   ├── generate-secrets.sh         # Generar secrets crypto
│   ├── blue-green-deploy.sh        # Core deployment (520 líneas)
│   ├── safe-migrate.sh             # Migraciones seguras
│   ├── rollback.sh                 # Rollback manual/auto
│   ├── backup-to-cloud.sh          # Backups a S3/Azure/GCS
│   ├── backup-volumes.sh           # Backup volúmenes Docker
│   └── renew-ssl.sh                # Renovar certificados SSL
│
├── docker-compose.*.yml
│   ├── docker-compose.yml          # Development
│   ├── docker-compose.prod.yml     # Base services (Postgres, Redis)
│   ├── docker-compose.blue.yml     # Blue environment
│   ├── docker-compose.green.yml    # Green environment
│   ├── docker-compose.monitoring.yml  # Prometheus + Grafana
│   ├── docker-compose.backup.yml   # Cron backups
│   └── docker-compose.certbot.yml  # SSL certificates
│
├── prometheus/
│   ├── prometheus.yml              # Scrape configs
│   ├── alerts.yml                  # Alert rules
│   ├── postgres-queries.yaml       # Custom DB metrics
│   └── alertmanager.yml            # Alert routing
│
├── grafana/
│   ├── provisioning/
│   │   ├── datasources/prometheus.yml
│   │   └── dashboards/dashboards.yml
│   └── dashboards/
│       └── platform-overview.json  # Main dashboard
│
├── nginx/
│   ├── nginx.conf                  # Nginx config
│   ├── upstream.conf               # Dynamic (generado por scripts)
│   └── upstream.conf.template      # Template
│
└── docs/
    ├── DEPLOYMENT_GUIDE.md         # Esta guía
    ├── DISASTER_RECOVERY.md        # Recovery procedures
    ├── MONITORING_RUNBOOK.md       # Monitoring guide
    └── CI_CD_ARCHITECTURE.md       # Este documento
```

---

**Última Revisión:** Marzo 10, 2026
**Versión del Sistema:** 1.0.0 (Production-Ready)
