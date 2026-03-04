# Infrastructure Documentation

## Overview

This document describes the infrastructure setup for the Ciber Platform MVP, including Docker services, deployment procedures, backup strategies, and monitoring.

## Architecture

### Services

1. **PostgreSQL 15** - Primary database
   - Persistent storage with automatic backups
   - Health checks every 10s
   - Resource limits: 2 CPU, 2GB RAM

2. **Redis 7** - Cache and session store
   - Persistent storage with AOF
   - JWT token blacklist
   - Resource limits: 1 CPU, 512MB RAM

3. **Backend API** (Node.js 20 + Express)
   - REST API server
   - Business logic layer
   - Resource limits: 2 CPU, 1GB RAM

4. **Code Executor** (Node.js 20 + Dockerode)
   - Isolated code execution in Docker containers
   - Supports Python, JavaScript, Bash
   - Resource limits: 4 CPU, 2GB RAM

5. **Frontend** (React 18 + Vite)
   - Static SPA served by Nginx
   - Built with production optimizations

6. **Nginx** - Reverse proxy and static file server
   - SSL/TLS termination
   - Load balancing
   - Static file serving

### Network

- Internal Docker network: `ciber-network` (172.28.0.0/16)
- Services communicate via internal DNS names
- Only Nginx exposes ports 80/443 to the internet

### Volumes

- `postgres_data` - Database files
- `redis_data` - Redis persistence
- `backend_uploads` - User file uploads
- `backend_logs` - Application logs
- `backend_public` - Public static files (certificates, etc.)
- `nginx_logs` - Nginx access and error logs

## Deployment

### Initial Setup

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd plataforma
   ```

2. Configure environment:
   ```bash
   cp .env.production.example .env
   # Edit .env with production values
   ```

3. Build sandbox image:
   ```bash
   cd executor
   docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
   cd ..
   ```

4. Deploy:
   ```bash
   chmod +x scripts/*.sh
   ./scripts/deploy.sh docker-compose.prod.yml
   ```

### Updates and Redeployment

```bash
./scripts/deploy.sh docker-compose.prod.yml
```

The deployment script:
- Pulls latest changes from git
- Creates database backup
- Builds Docker images
- Runs database migrations
- Restarts services
- Performs health checks

## Database Management

### Backups

**Automated Backups:**
```bash
# Manual backup
./scripts/backup-db.sh

# The script:
# - Creates timestamped SQL dump
# - Compresses with gzip
# - Keeps last 7 backups (configurable)
```

**Backup Location:** `database/backups/`

**Backup Naming:** `backup_YYYYMMDD_HHMMSS.sql.gz`

### Restore

```bash
./scripts/restore-db.sh backup_20240101_120000.sql.gz
```

**Warning:** This will replace all current database data!

### Migrations

Database schema changes are managed via Prisma:

```bash
# Apply pending migrations (production)
docker exec ciber-backend-prod npx prisma migrate deploy

# View migration status
docker exec ciber-backend-prod npx prisma migrate status
```

## Monitoring and Logging

### Health Checks

All services have health check endpoints:

- Backend: `http://localhost:4000/health`
- Executor: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`

### Logs

View service logs:
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

Log locations:
- Backend application logs: `backend_logs` volume
- Nginx logs: `nginx_logs` volume

### Resource Monitoring

```bash
# Service resource usage
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
```

## Security

### Secrets Management

**DO NOT** commit secrets to git. Use environment variables.

Generate strong secrets:
```bash
# For JWT secrets (minimum 32 characters)
openssl rand -base64 48

# For database password
openssl rand -base64 32
```

### SSL/TLS

Place SSL certificates in `nginx/ssl/`:
- `certificate.crt` - SSL certificate
- `private.key` - Private key
- `ca_bundle.crt` - CA bundle (optional)

Update `nginx/nginx.prod.conf` to use certificates.

### Firewall Rules

Recommended firewall configuration:

```bash
# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH (if needed)
ufw allow 22/tcp

# Block all other inbound traffic
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw enable
```

### Docker Security

The code executor service runs with:
- Network isolation (`--network none`)
- Memory limits (256MB default)
- CPU limits (1 CPU default)
- Read-only filesystem
- Non-root user (`sandbox`)
- Timeout enforcement (30s default)

## Troubleshooting

### Service Won't Start

```bash
# Check service logs
docker-compose -f docker-compose.prod.yml logs service-name

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart service-name
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker logs ciber-postgres-prod

# Connect to database
docker exec -it ciber-postgres-prod psql -U ciber_admin -d ciber_platform

# Check connections
SELECT * FROM pg_stat_activity;
```

### Redis Connection Issues

```bash
# Check Redis logs
docker logs ciber-redis-prod

# Connect to Redis
docker exec -it ciber-redis-prod redis-cli -a <password>

# Check connection
PING
```

### Code Executor Issues

```bash
# Check executor logs
docker logs ciber-executor-prod

# Verify Docker socket access
docker exec ciber-executor-prod docker ps

# Check sandbox image
docker images | grep ciber-sandbox
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Remove old volumes
docker volume prune
```

## Performance Tuning

### Database

Edit `database/init-scripts/postgresql.conf`:
```
shared_buffers = 512MB
effective_cache_size = 2GB
max_connections = 100
```

### Redis

Edit `docker-compose.prod.yml` Redis command:
```yaml
command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes
```

### Nginx

Edit `nginx/nginx.prod.conf`:
```nginx
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Disaster Recovery

### Complete System Backup

```bash
# 1. Backup database
./scripts/backup-db.sh

# 2. Backup volumes
docker run --rm -v ciber-backend_uploads:/data -v $(pwd)/backups:/backup \
  alpine tar czf /backup/uploads_$(date +%Y%m%d).tar.gz /data

# 3. Backup .env and configuration
tar czf config_backup_$(date +%Y%m%d).tar.gz .env nginx/ssl
```

### Complete System Restore

```bash
# 1. Restore database
./scripts/restore-db.sh <backup_file>

# 2. Restore volumes
docker run --rm -v ciber-backend_uploads:/data -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/uploads_YYYYMMDD.tar.gz -C /

# 3. Restore configuration
tar xzf config_backup_YYYYMMDD.tar.gz
```

## Maintenance Tasks

### Weekly
- Review logs for errors
- Check disk usage
- Verify backups are running
- Update dependencies (security patches)

### Monthly
- Review resource usage and optimize
- Clean up old backups
- Update documentation
- Test disaster recovery procedures

### Quarterly
- Security audit
- Performance testing
- Update Docker images
- Review and update secrets

## Support and Contact

For issues or questions:
- Check logs first
- Review this documentation
- Contact DevOps team

---

Last updated: 2026-03-04
Version: 1.0
