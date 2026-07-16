#!/usr/bin/env bash
# =============================================================================
# pipeline.sh - Build local → Deploy QA → E2E tests → Deploy PROD
# =============================================================================
#
# Uso:
#   PASS_SSH=qwerty ./scripts/pipeline.sh
#   PASS_SSH=qwerty SKIP_PROD=true ./scripts/pipeline.sh    # solo QA + tests
#   PASS_SSH=qwerty QA_PORT=8080 ./scripts/pipeline.sh      # puerto QA explicito
#   PASS_SSH=qwerty SKIP_BUILD=true IMAGES_TAR=/tmp/ciber-images-abc.tar.gz ./scripts/pipeline.sh
#
# Requisitos: docker, python3 con paramiko instalado
# =============================================================================

set -e
set -o pipefail

# ─────────────────────────────────────────────────────────
# CONFIGURACION
# Carga credenciales desde .env.pipeline si existe
# ─────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

ENV_PIPELINE="${PROJECT_ROOT}/.env.pipeline"
if [ -f "$ENV_PIPELINE" ]; then
    set -o allexport
    # shellcheck source=/dev/null
    source "$ENV_PIPELINE"
    set +o allexport
fi

QA_SERVER="${QA_SERVER:-192.168.200.21}"
PROD_SERVER="${PROD_SERVER:-192.168.200.98}"
SSH_USER="${SSH_USER:-itac}"
PASS_SSH="${PASS_SSH:?ERROR: PASS_SSH es requerido. Crear plataforma/.env.pipeline con PASS_SSH=xxx}"
REMOTE_DIR="/home/${SSH_USER}/LMS/plataforma"
SKIP_PROD="${SKIP_PROD:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"

GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
IMAGES_TAR="${IMAGES_TAR:-/tmp/ciber-images-${GIT_SHA}.tar.gz}"

if [ -n "$TEMP" ]; then
    TMP_DIR="$TEMP"
else
    TMP_DIR="/tmp"
fi

PIPELINE_START=$(date +%s)

# ─────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

log()     { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[!!]${NC} $1"; }
err()     { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info()    { echo -e "${CYAN}[>>]${NC} $1"; }
section() { echo -e "\n${BOLD}${BLUE}══════════════════════════════════════════${NC}"; echo -e "${BOLD}${BLUE}  $1${NC}"; echo -e "${BOLD}${BLUE}══════════════════════════════════════════${NC}"; }
elapsed() { echo $(( $(date +%s) - PIPELINE_START ))s; }

# ─────────────────────────────────────────────────────────
# FASE 0: INFORMACION INICIAL
# ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Pipeline: Local → QA → E2E → PROD${NC}"
echo ""
info "Git SHA:     $GIT_SHA"
info "QA Server:   $QA_SERVER"
info "PROD Server: $PROD_SERVER"
info "Images tar:  $IMAGES_TAR"
info "Skip build:  $SKIP_BUILD"
info "Skip prod:   $SKIP_PROD"
echo ""

# ─────────────────────────────────────────────────────────
# FASE 1: BUILD IMAGENES (una sola vez)
# ─────────────────────────────────────────────────────────
section "FASE 1: BUILD"

if [ "$SKIP_BUILD" = "true" ]; then
    if [ ! -f "$IMAGES_TAR" ]; then
        err "SKIP_BUILD=true pero IMAGES_TAR no existe: $IMAGES_TAR"
    fi
    warn "Build saltado. Usando tar existente: $IMAGES_TAR"
else
    export MSYS_NO_PATHCONV=1

    VITE_DSN=""
    if [ -f .env ]; then
        VITE_DSN=$(grep -E "^VITE_GLITCHTIP_DSN=" .env 2>/dev/null | cut -d= -f2- || true)
    fi

    info "Construyendo backend..."
    docker build \
        --target production \
        -t plataforma-backend:latest \
        -t "plataforma-backend:sha-${GIT_SHA}" \
        -f backend-fastapi/Dockerfile \
        backend-fastapi/ \
        2>&1 | tail -5
    log "Backend OK"

    info "Construyendo frontend..."
    docker build \
        --target production \
        --build-arg VITE_API_URL="/api" \
        --build-arg VITE_EXECUTOR_URL="/executor" \
        --build-arg VITE_ENV="production" \
        ${VITE_DSN:+--build-arg "VITE_GLITCHTIP_DSN=$VITE_DSN"} \
        -t plataforma-frontend:latest \
        -t "plataforma-frontend:sha-${GIT_SHA}" \
        -f frontend/Dockerfile \
        frontend/ \
        2>&1 | tail -5
    log "Frontend OK"

    info "Construyendo executor..."
    docker build \
        --target production \
        -t plataforma-executor:latest \
        -t "plataforma-executor:sha-${GIT_SHA}" \
        -f executor/Dockerfile \
        executor/ \
        2>&1 | tail -5
    log "Executor OK"

    info "Guardando imagenes en tar (esto puede tardar)..."
    docker save plataforma-backend plataforma-frontend plataforma-executor | gzip > "$IMAGES_TAR"

    if command -v cygpath &>/dev/null; then
        IMAGES_TAR_ABS="$(cygpath -w "$IMAGES_TAR")"
    else
        IMAGES_TAR_ABS="$IMAGES_TAR"
    fi

    TAR_SIZE=$(du -h "$IMAGES_TAR" | cut -f1)
    log "Imagenes guardadas: $IMAGES_TAR ($TAR_SIZE)"
fi

# ─────────────────────────────────────────────────────────
# FASE 2: DEPLOY QA
# ─────────────────────────────────────────────────────────
section "FASE 2: DEPLOY QA ($QA_SERVER)"

if command -v cygpath &>/dev/null; then
    IMAGES_TAR_ABS="$(cygpath -w "$IMAGES_TAR")"
else
    IMAGES_TAR_ABS="$IMAGES_TAR"
fi

python3 -c "
import paramiko, os, sys, time

SERVER = '${QA_SERVER}'
USER   = '${SSH_USER}'
PASS   = '${PASS_SSH}'
RDIR   = '${REMOTE_DIR}'
IMAGES = r'${IMAGES_TAR_ABS}'

print(f'Conectando a QA {SERVER}...')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASS, timeout=15)
sftp = ssh.open_sftp()

def run(cmd, timeout=180, check=False):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err_out = stderr.read().decode('utf-8', errors='replace')
    if check and (stdout.channel.recv_exit_status() != 0):
        print(f'STDERR: {err_out[-500:]}')
        raise RuntimeError(f'Comando fallo: {cmd}')
    return out, err_out

# Asegurar directorio remoto
run(f'mkdir -p {RDIR}/scripts {RDIR}/nginx {RDIR}/database/backups')

# Sincronizar archivos de configuracion necesarios
config_files = [
    'docker-compose.qa.yml',
    '.env.example',
    'nginx/nginx.conf',
    'nginx/upstream.conf',
]
for f in config_files:
    local = os.path.join(os.getcwd(), f)
    if os.path.exists(local):
        remote_dir = os.path.dirname(f'{RDIR}/{f}')
        run(f'mkdir -p {remote_dir}')
        try:
            sftp.put(local, f'{RDIR}/{f}')
        except Exception as e:
            print(f'  Aviso: no se pudo subir {f}: {e}')

# Subir y verificar .env en QA (solo si no existe)
env_out, _ = run(f'test -f {RDIR}/.env && echo exists || echo missing')
if 'missing' in env_out:
    env_example = os.path.join(os.getcwd(), '.env.example')
    if os.path.exists(env_example):
        sftp.put(env_example, f'{RDIR}/.env')
        print('  .env creado desde .env.example (editar credenciales en QA si es necesario)')

sftp.close()
print('Archivos de configuracion sincronizados')

# Subir imagenes
size_mb = os.path.getsize(IMAGES) / (1024 * 1024)
print(f'Subiendo imagenes ({size_mb:.0f}MB)...')
sftp2 = ssh.open_sftp()
sftp2.put(IMAGES, '/tmp/ciber-images-pipeline.tar.gz')
sftp2.close()
print('Subida completada')

# Cargar imagenes Docker en QA
print('Cargando imagenes Docker...')
out, _ = run('gunzip -c /tmp/ciber-images-pipeline.tar.gz | docker load', timeout=300)
print(f'  {out.strip()[-300:]}')

# Bajar servicios anteriores
print('Reiniciando servicios QA...')
run(f'cd {RDIR} && docker compose -f docker-compose.qa.yml down --remove-orphans', timeout=60)
time.sleep(3)

out, _ = run(f'cd {RDIR} && docker compose -f docker-compose.qa.yml up -d 2>&1', timeout=120)
if 'error' in out.lower() and 'warning' not in out.lower():
    print(f'  Salida compose: {out[-500:]}')

print('Servicios iniciados')

# Esperar health del backend
print('Esperando health checks (max 90s)...')
for i in range(18):
    health, _ = run('docker inspect --format=\"{{.State.Health.Status}}\" ciber-backend-qa 2>/dev/null || echo missing')
    health = health.strip()
    if health == 'healthy':
        print(f'  Backend QA healthy en {(i+1)*5}s')
        break
    if i == 17:
        print('  TIMEOUT: backend no reporta healthy, continuando de todas formas...')
        logs, _ = run('docker logs ciber-backend-qa --tail 30 2>&1')
        print(f'  Ultimos logs backend: {logs[-500:]}')
    print(f'  [{(i+1)*5}s] estado: {health}...')
    time.sleep(5)

# Migraciones
print('Aplicando migraciones Alembic...')
out, _ = run('docker exec ciber-backend-qa python -m alembic upgrade head 2>&1', timeout=120)
if 'error' in out.lower() or 'exception' in out.lower():
    print(f'  AVISO migracion: {out.strip()[-300:]}')
else:
    print(f'  Migraciones OK: {out.strip()[-200:] or \"sin cambios\"}')

# Seed de datos de prueba
print('Ejecutando seed de datos (idempotente)...')
out, _ = run('docker exec ciber-backend-qa python -m app.scripts.seed_base 2>&1', timeout=120)
if 'error' in out.lower():
    print(f'  AVISO seed: {out.strip()[-200:]}')
else:
    print('  Seed completado')

# Status final
out, _ = run('docker ps --format \"{{.Names}} {{.Status}}\" | grep ciber | sort')
print()
print('=== Servicios QA ===')
print(out)

ssh.close()
print('Deploy QA completado')
" 2>&1 || err "Deploy QA fallo"

log "Deploy QA exitoso"

# ─────────────────────────────────────────────────────────
# AUTO-DETECTAR PUERTO QA
# ─────────────────────────────────────────────────────────
info "Detectando puerto nginx en QA..."

QA_URL=""
# Si QA_PORT esta definido, usarlo directamente sin auto-detectar
if [ -n "${QA_PORT:-}" ]; then
    PROTO="http"
    [ "$QA_PORT" = "443" ] && PROTO="https"
    QA_URL="${PROTO}://${QA_SERVER}:${QA_PORT}"
    log "QA accesible en: $QA_URL (puerto explícito)"
else
    for PORT in 8080 80 443; do
        PROTO="http"
        [ "$PORT" = "443" ] && PROTO="https"
        TEST_URL="${PROTO}://${QA_SERVER}:${PORT}"
        if curl -sk --max-time 5 "${TEST_URL}/health" 2>/dev/null | grep -qiE '"ok"|"healthy"'; then
            QA_URL="$TEST_URL"
            log "QA accesible en: $QA_URL"
            break
        elif curl -sk --max-time 5 "${TEST_URL}" 2>/dev/null | grep -q "html"; then
            QA_URL="$TEST_URL"
            log "QA accesible en: $QA_URL (frontend detectado)"
            break
        fi
    done
fi

if [ -z "$QA_URL" ]; then
    warn "No se pudo auto-detectar el puerto QA. Prueba con: QA_PORT=8080 ./scripts/pipeline.sh"
    warn "Asumiendo http://${QA_SERVER}:80"
    QA_URL="http://${QA_SERVER}:80"
fi

# ─────────────────────────────────────────────────────────
# FASE 3: E2E TESTS
# ─────────────────────────────────────────────────────────
section "FASE 3: E2E TESTS → $QA_URL"

info "Ejecutando tests E2E contra QA..."
info "BASE_URL=$QA_URL"
echo ""

E2E_EXIT=0
BASE_URL="$QA_URL" npx playwright test --reporter=list 2>&1 || E2E_EXIT=$?

echo ""
if [ $E2E_EXIT -ne 0 ]; then
    echo -e "${RED}══════════════════════════════════════════${NC}"
    echo -e "${RED}  E2E TESTS FALLARON - PROD CANCELADO${NC}"
    echo -e "${RED}══════════════════════════════════════════${NC}"
    echo ""
    warn "Reporte HTML: npx playwright show-report"
    warn "Deploy a PROD fue CANCELADO porque los tests fallaron"
    echo ""
    warn "Tiempo total: $(elapsed)"
    exit 1
fi

log "Todos los E2E tests pasaron"

# ─────────────────────────────────────────────────────────
# FASE 4: DEPLOY PROD
# ─────────────────────────────────────────────────────────
if [ "$SKIP_PROD" = "true" ]; then
    warn "SKIP_PROD=true - Deploy a PROD omitido"
else
    section "FASE 4: DEPLOY PROD ($PROD_SERVER)"

    python3 -c "
import paramiko, os, sys, time, platform

SERVER = '${PROD_SERVER}'
USER   = '${SSH_USER}'
PASS   = '${PASS_SSH}'
RDIR   = '${REMOTE_DIR}'
IMAGES = r'${IMAGES_TAR_ABS}'

print(f'Conectando a PROD {SERVER}...')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER, username=USER, password=PASS, timeout=15)

def run(cmd, timeout=180):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err_out = stderr.read().decode('utf-8', errors='replace')
    return out, err_out

sftp = ssh.open_sftp()

# Asegurar estructura de directorios
run(f'mkdir -p {RDIR}/scripts {RDIR}/nginx/ssl {RDIR}/database/backups')

# Sincronizar archivos de configuracion
config_files = [
    'docker-compose.prod.yml',
    '.env.example',
    'nginx/nginx.prod.conf',
    'nginx/nginx.conf',
    'nginx/upstream.conf',
]
for f in config_files:
    local = os.path.join(os.getcwd(), f)
    if os.path.exists(local):
        remote_dir = os.path.dirname(f'{RDIR}/{f}')
        run(f'mkdir -p {remote_dir}')
        try:
            sftp.put(local, f'{RDIR}/{f}')
        except Exception as e:
            print(f'  Aviso: no se pudo subir {f}: {e}')

# Subir certificados SSL si existen
if platform.system() == 'Windows':
    cert_src = r'C:\Users\Itac\Downloads\capacitaciones.itac.com.co.crt'
    key_src  = r'C:\Users\Itac\Downloads\capacitaciones.itac.com.co.key'
else:
    dl = os.path.expanduser('~/Downloads')
    cert_src = os.path.join(dl, 'capacitaciones.itac.com.co.crt')
    key_src  = os.path.join(dl, 'capacitaciones.itac.com.co.key')

if os.path.exists(cert_src) and os.path.exists(key_src):
    sftp.put(cert_src, f'{RDIR}/nginx/ssl/cert.pem')
    sftp.put(key_src,  f'{RDIR}/nginx/ssl/key.pem')
    run(f'chmod 600 {RDIR}/nginx/ssl/cert.pem {RDIR}/nginx/ssl/key.pem')
    print('Certificados SSL subidos')
else:
    print(f'Aviso: certificados SSL no encontrados en Downloads - subir manualmente a {RDIR}/nginx/ssl/')

# Verificar .env en PROD
env_out, _ = run(f'test -f {RDIR}/.env && echo exists || echo missing')
if 'missing' in env_out:
    env_example = os.path.join(os.getcwd(), '.env.example')
    if os.path.exists(env_example):
        sftp.put(env_example, f'{RDIR}/.env')
        print('  .env creado desde .env.example en PROD (revisar credenciales)')

sftp.close()

# Subir imagenes (las mismas que se desplegaron en QA)
size_mb = os.path.getsize(IMAGES) / (1024 * 1024)
print(f'Subiendo imagenes a PROD ({size_mb:.0f}MB)...')
sftp2 = ssh.open_sftp()
sftp2.put(IMAGES, '/tmp/ciber-images-pipeline.tar.gz')
sftp2.close()
print('Subida completada')

# Cargar imagenes
print('Cargando imagenes Docker...')
out, _ = run('gunzip -c /tmp/ciber-images-pipeline.tar.gz | docker load', timeout=300)
print(f'  {out.strip()[-200:]}')

# Reiniciar servicios
print('Reiniciando servicios PROD...')
run(f'cd {RDIR} && docker compose -f docker-compose.prod.yml down --remove-orphans', timeout=60)
time.sleep(3)
out, _ = run(f'cd {RDIR} && docker compose -f docker-compose.prod.yml up -d --no-build 2>&1', timeout=120)

# Esperar health
print('Esperando health checks PROD (max 90s)...')
for i in range(18):
    health, _ = run('docker inspect --format=\"{{.State.Health.Status}}\" ciber-backend-prod 2>/dev/null || echo missing')
    health = health.strip()
    if health == 'healthy':
        print(f'  Backend PROD healthy en {(i+1)*5}s')
        break
    if i == 17:
        print('  TIMEOUT esperando health - verificar logs')
        logs, _ = run('docker logs ciber-backend-prod --tail 30 2>&1')
        print(f'  {logs[-500:]}')
    time.sleep(5)

# Migraciones PROD
print('Aplicando migraciones Alembic...')
out, _ = run('docker exec ciber-backend-prod python -m alembic upgrade head 2>&1', timeout=120)
if 'error' in out.lower() or 'exception' in out.lower():
    print(f'  AVISO migracion: {out.strip()[-300:]}')
    sys.exit(1)
else:
    print(f'  Migraciones OK')

# Status
out, _ = run('docker ps --format \"{{.Names}} {{.Status}}\" | grep ciber | sort')
print()
print('=== Servicios PROD ===')
print(out)

# Health check final
out_https, _ = run('curl -sk https://localhost/health 2>/dev/null')
out_http, _  = run('curl -sf http://localhost:4000/health 2>/dev/null')
if 'ok' in out_https or 'healthy' in out_https or 'ok' in out_http:
    print('Backend PROD: HEALTHY')
else:
    print('Backend PROD: no responde (verificar logs)')

ssh.close()
print('Deploy PROD completado')
" 2>&1 || err "Deploy PROD fallo"

    log "Deploy PROD exitoso"
fi

# ─────────────────────────────────────────────────────────
# FASE 5: CLEANUP Y RESUMEN
# ─────────────────────────────────────────────────────────
section "RESUMEN"

# Limpiar tar (ya no lo necesitamos)
if [ "$SKIP_BUILD" != "true" ] && [ -f "$IMAGES_TAR" ]; then
    rm -f "$IMAGES_TAR"
    info "Tar de imagenes eliminado"
fi

echo ""
echo -e "  ${GREEN}Git SHA:${NC}      sha-${GIT_SHA}"
echo -e "  ${GREEN}QA URL:${NC}       ${QA_URL}"
if [ "$SKIP_PROD" != "true" ]; then
    echo -e "  ${GREEN}PROD:${NC}         http://${PROD_SERVER}"
fi
echo -e "  ${GREEN}E2E Tests:${NC}    PASARON"
echo -e "  ${GREEN}Tiempo total:${NC} $(elapsed)"
echo ""
if [ "$SKIP_PROD" = "true" ]; then
    echo -e "  ${YELLOW}PROD no fue actualizado (SKIP_PROD=true)${NC}"
fi
echo ""
