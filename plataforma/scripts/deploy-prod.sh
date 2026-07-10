#!/bin/bash
# ===========================================
# Deploy to PROD (192.168.200.98) - HTTPS
# ===========================================
# Builds locally, uploads images + SSL certs, deploys on remote server.
# Handles Windows Git Bash path conversion issues.
#
# Usage:
#   ./scripts/deploy-prod.sh
#   SERVER=192.168.200.98 USER_SSH=itac ./scripts/deploy-prod.sh
#
# Requirements: docker, python3 with paramiko
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!!]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[>>]${NC} $1"; }

# --- Config ---
SERVER="${SERVER:-192.168.200.98}"
USER_SSH="${USER_SSH:-itac}"
PASS_SSH="${PASS_SSH:?ERROR: PASS_SSH es requerido. Uso: PASS_SSH=xxx ./scripts/deploy-prod.sh}"
REMOTE_DIR="/home/${USER_SSH}/LMS/plataforma"
COMPOSE_FILE="docker-compose.prod.yml"

# Detect temp dir (Windows vs Linux)
if [ -n "$TEMP" ]; then
    TMP_DIR="$TEMP"
else
    TMP_DIR="/tmp"
fi

echo ""
echo "=========================================="
echo "  PROD Deploy (HTTPS)"
echo "=========================================="
echo ""
info "Server: ${SERVER}"
info "Remote: ${REMOTE_DIR}"

# --- Step 1: Build images ---
info "Building production images..."

# MSYS_NO_PATHCONV prevents Git Bash from converting /api to C:/Program Files/Git/api
export MSYS_NO_PATHCONV=1

# Read VITE_GLITCHTIP_DSN from .env if available
VITE_DSN=""
if [ -f .env ]; then
    VITE_DSN=$(grep VITE_GLITCHTIP_DSN .env 2>/dev/null | cut -d= -f2- || true)
fi

docker compose -f "$COMPOSE_FILE" build --quiet 2>&1 || {
    # If compose build fails (missing base images), build individually
    warn "Compose build failed, building with Dockerfiles directly..."
    docker build --target production -t plataforma-backend:latest -f backend-fastapi/Dockerfile backend-fastapi/ 2>&1 | tail -3
    docker build --target production \
        --build-arg VITE_ENV=production \
        ${VITE_DSN:+--build-arg "VITE_GLITCHTIP_DSN=$VITE_DSN"} \
        -t plataforma-frontend:latest -f frontend/Dockerfile frontend/ 2>&1 | tail -3
    docker build --target production -t plataforma-executor:latest -f executor/Dockerfile executor/ 2>&1 | tail -3
}
log "Images built"

# --- Step 2: Save images ---
info "Saving images to tar..."
IMAGES_FILE="${TMP_DIR}/prod-images.tar.gz"
docker save plataforma-backend plataforma-frontend plataforma-executor | gzip > "$IMAGES_FILE"
# Resolve to absolute Windows path for Python
if command -v cygpath &>/dev/null; then
    IMAGES_FILE_ABS="$(cygpath -w "$IMAGES_FILE")"
else
    IMAGES_FILE_ABS="$IMAGES_FILE"
fi
SIZE=$(du -h "$IMAGES_FILE" | cut -f1)
log "Images saved: ${SIZE}"

# --- Step 3: Upload and deploy via Python/Paramiko ---
info "Deploying to ${SERVER}..."

python -c "
import paramiko, os, sys, time, platform

SERVER = '${SERVER}'
USER = '${USER_SSH}'
PASS = '${PASS_SSH}'
REMOTE_DIR = '${REMOTE_DIR}'
IMAGES = r'${IMAGES_FILE_ABS}'
COMPOSE = '${COMPOSE_FILE}'

print('Connecting...')
ssh = paramiko.SSHClient()
ssh.load_system_host_keys()
ssh.set_missing_host_key_policy(paramiko.RejectPolicy())
ssh.connect(SERVER, username=USER, password=PASS, timeout=15)
sftp = ssh.open_sftp()

# Upload images
size_mb = os.path.getsize(IMAGES) / (1024*1024)
print(f'Uploading images ({size_mb:.0f}MB)...')
sftp.put(IMAGES, '/tmp/prod-images.tar.gz')
print('Upload done')

# Sync config files
config_files = [
    f'{COMPOSE}',
    '.env.example',
    'Makefile',
    'scripts/deploy.sh',
    'scripts/update.sh',
]
for f in config_files:
    local = os.path.join(os.getcwd(), f)
    if os.path.exists(local):
        remote = f'{REMOTE_DIR}/{f}'
        try:
            sftp.put(local, remote)
        except:
            pass

# Sync backend source
import glob
for local in glob.glob('backend-fastapi/app/**/*.py', recursive=True):
    remote = f'{REMOTE_DIR}/{local}'
    remote_dir = '/'.join(remote.split('/')[:-1])
    try: sftp.stat(remote_dir)
    except:
        parts = remote_dir.split('/')
        for i in range(2, len(parts)+1):
            try: sftp.stat('/'.join(parts[:i]))
            except: sftp.mkdir('/'.join(parts[:i]))
    sftp.put(local, remote)

sftp.close()
print('Files synced')

def run(cmd, timeout=120):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    return stdout.read().decode('utf-8', errors='replace')

# Upload nginx.prod.conf
print('Uploading nginx prod config...')
sftp2 = ssh.open_sftp()
nginx_local = os.path.join(os.getcwd(), 'nginx', 'nginx.prod.conf')
if os.path.exists(nginx_local):
    run(f'mkdir -p {REMOTE_DIR}/nginx')
    sftp2.put(nginx_local, f'{REMOTE_DIR}/nginx/nginx.prod.conf')
    print('nginx.prod.conf uploaded')

# Upload SSL certs
if platform.system() == 'Windows':
    cert_local = r'C:\Users\Itac\Downloads\capacitaciones.itac.com.co.crt'
    key_local  = r'C:\Users\Itac\Downloads\capacitaciones.itac.com.co.key'
else:
    downloads = os.path.expanduser('~/Downloads')
    cert_local = os.path.join(downloads, 'capacitaciones.itac.com.co.crt')
    key_local  = os.path.join(downloads, 'capacitaciones.itac.com.co.key')

if os.path.exists(cert_local) and os.path.exists(key_local):
    run(f'mkdir -p {REMOTE_DIR}/nginx/ssl && chmod 700 {REMOTE_DIR}/nginx/ssl')
    sftp2.put(cert_local, f'{REMOTE_DIR}/nginx/ssl/cert.pem')
    sftp2.put(key_local,  f'{REMOTE_DIR}/nginx/ssl/key.pem')
    run(f'chmod 600 {REMOTE_DIR}/nginx/ssl/cert.pem {REMOTE_DIR}/nginx/ssl/key.pem')
    print('SSL certs uploaded')
else:
    print(f'WARNING: SSL certs no encontrados. Subir manualmente a {REMOTE_DIR}/nginx/ssl/')

sftp2.close()

# Load images
print('Loading Docker images...')
run('gunzip -c /tmp/prod-images.tar.gz | docker load', timeout=180)
print('Images loaded')

# Down + Up
print('Restarting services...')
run(f'cd {REMOTE_DIR} && docker compose -f {COMPOSE} down --remove-orphans', timeout=60)
time.sleep(3)
out = run(f'cd {REMOTE_DIR} && docker compose -f {COMPOSE} up -d', timeout=120)
print('Services started')

# Wait for health
print('Waiting for health checks...')
time.sleep(20)

# Apply migrations
print('Applying migrations...')
out = run(f'docker exec ciber-backend-prod alembic upgrade head 2>&1')
print(f'  Migration: {out.strip()[-200:]}')
if 'error' in out.lower() or 'exception' in out.lower():
    print('  ERROR: Migration failed - check logs and apply manually')
    sys.exit(1)

# Health checks
time.sleep(5)
out = run('docker ps --format \"{{{{.Names}}}} {{{{.Status}}}}\" | grep ciber | sort')
print()
print('=== Services ===')
print(out)

# Final health check via HTTPS
out = run('curl -sk https://localhost/health 2>/dev/null')
if 'healthy' in out:
    print('Backend: healthy')
else:
    # Fallback a puerto directo
    out = run('curl -sf http://localhost:4000/health 2>/dev/null')
    if 'ok' in out:
        print('Backend: healthy')
    else:
        print('Backend: UNHEALTHY - verificar logs')

print()
print('Deploy complete!')
ssh.close()
" 2>&1 || err "Deploy failed"

log "PROD deploy complete"
echo ""
echo "=========================================="
echo -e "  ${GREEN}Deploy PROD successful${NC}"
echo "=========================================="
