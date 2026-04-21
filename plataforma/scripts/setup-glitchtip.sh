#!/bin/bash
# ===========================================
# GlitchTip Setup Script
# ===========================================
# Levanta GlitchTip (error tracking compatible con Sentry)
# y configura el DSN para backend y frontend.
#
# Uso:
#   ./scripts/setup-glitchtip.sh
#   ./scripts/setup-glitchtip.sh --email admin@ciber.com
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

# Parse args
ADMIN_EMAIL="admin@ciber.com"
for arg in "$@"; do
    case $arg in
        --email) ADMIN_EMAIL="$2"; shift 2 ;;
        --email=*) ADMIN_EMAIL="${arg#*=}" ;;
    esac
done

# Detect compose
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

echo ""
echo "=========================================="
echo "  GlitchTip - Error Tracking Setup"
echo "=========================================="
echo ""

# 1. Generate secrets if not in .env
info "Configurando variables de entorno..."

if ! grep -q "GLITCHTIP_SECRET_KEY" .env 2>/dev/null; then
    GT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
    GT_DB_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)

    echo "" >> .env
    echo "# ===== GLITCHTIP =====" >> .env
    echo "GLITCHTIP_SECRET_KEY=${GT_SECRET}" >> .env
    echo "GLITCHTIP_DB_PASSWORD=${GT_DB_PASS}" >> .env
    echo "GLITCHTIP_PORT=8000" >> .env
    log "Secrets generados y agregados a .env"
else
    log "Variables GlitchTip ya existen en .env"
fi

# 2. Start GlitchTip services
info "Levantando GlitchTip..."
$COMPOSE -f docker-compose.monitoring.yml up -d glitchtip-postgres glitchtip-redis glitchtip glitchtip-worker 2>&1

# 3. Wait for GlitchTip to be ready
info "Esperando a que GlitchTip este listo..."
MAX_WAIT=60
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    if curl -sf http://localhost:8000/_health/ > /dev/null 2>&1; then
        log "GlitchTip ready"
        break
    fi
    echo -n "."
    sleep 3
    WAITED=$((WAITED + 3))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    warn "GlitchTip no respondio en ${MAX_WAIT}s"
    warn "Verifica logs: docker logs ciber-glitchtip"
    exit 1
fi

# 4. Run migrations
info "Ejecutando migraciones de GlitchTip..."
docker exec ciber-glitchtip ./manage.py migrate --noinput 2>&1 | tail -3

# 5. Create superuser
info "Creando usuario administrador..."
echo ""
echo -e "${YELLOW}Ingresa la password para el admin de GlitchTip:${NC}"
docker exec -it ciber-glitchtip ./manage.py createsuperuser --email "$ADMIN_EMAIL" 2>&1 || {
    warn "El usuario ya existe o se cancelo la creacion"
}

# 6. Print instructions
echo ""
echo "=========================================="
echo -e "  ${GREEN}GlitchTip configurado${NC}"
echo "=========================================="
echo ""
echo "  Dashboard: http://localhost:8000"
echo "  Email:     $ADMIN_EMAIL"
echo ""
echo "  Siguientes pasos:"
echo "  1. Inicia sesion en http://localhost:8000"
echo "  2. Crea una organizacion"
echo "  3. Crea un proyecto (tipo: FastAPI o Python)"
echo "  4. Copia el DSN que te da"
echo "  5. Agrega a .env:"
echo "     GLITCHTIP_DSN=http://...@localhost:8000/1"
echo "     VITE_GLITCHTIP_DSN=http://...@localhost:8000/1"
echo "  6. Reinicia backend y frontend:"
echo "     docker compose restart backend"
echo "     docker compose up -d --build frontend"
echo ""
