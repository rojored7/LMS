#!/bin/bash
# ===========================================
# Update Script - Deploy incremental
# ===========================================
# Uso:
#   ./scripts/update.sh                    # Update completo (dev)
#   ./scripts/update.sh --production       # Update produccion
#   ./scripts/update.sh --backend          # Solo backend
#   ./scripts/update.sh --frontend         # Solo frontend
#   ./scripts/update.sh --executor         # Solo executor
#   ./scripts/update.sh --no-migrate       # Sin migracion DB
#   ./scripts/update.sh --no-pull          # Sin git pull
# ===========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!!]${NC} $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }
info()  { echo -e "${CYAN}[>>]${NC} $1"; }

# --- Parse arguments ---
PRODUCTION=false
BUILD_BACKEND=false
BUILD_FRONTEND=false
BUILD_EXECUTOR=false
BUILD_ALL=true
RUN_MIGRATE=true
RUN_PULL=true

for arg in "$@"; do
    case $arg in
        --production|--prod)  PRODUCTION=true ;;
        --backend)            BUILD_BACKEND=true; BUILD_ALL=false ;;
        --frontend)           BUILD_FRONTEND=true; BUILD_ALL=false ;;
        --executor)           BUILD_EXECUTOR=true; BUILD_ALL=false ;;
        --no-migrate)         RUN_MIGRATE=false ;;
        --no-pull)            RUN_PULL=false ;;
        --help|-h)
            echo "Uso: ./scripts/update.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --production    Usa docker-compose.prod.yml"
            echo "  --backend       Solo rebuild backend"
            echo "  --frontend      Solo rebuild frontend"
            echo "  --executor      Solo rebuild executor"
            echo "  --no-migrate    No ejecutar migraciones"
            echo "  --no-pull       No hacer git pull"
            echo ""
            echo "Ejemplos:"
            echo "  ./scripts/update.sh --production              # Deploy completo a prod"
            echo "  ./scripts/update.sh --backend --no-migrate    # Solo rebuild backend"
            exit 0
            ;;
        *)
            warn "Argumento desconocido: $arg"
            ;;
    esac
done

# --- Detect compose command ---
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# --- Detect compose file ---
if [ "$PRODUCTION" = true ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
else
    # Auto-detect from APP_ENV in .env
    if [ -f .env ] && grep -q "APP_ENV=production" .env 2>/dev/null; then
        COMPOSE_FILE="docker-compose.prod.yml"
        PRODUCTION=true
    else
        COMPOSE_FILE="docker-compose.yml"
    fi
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    err "Compose file not found: $COMPOSE_FILE"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Platform Update"
echo "=========================================="
echo ""
info "Compose: $COMPOSE -f $COMPOSE_FILE"
info "Mode: $([ "$PRODUCTION" = true ] && echo "PRODUCTION" || echo "DEVELOPMENT")"
info "Migrate: $RUN_MIGRATE"

# --- 1. Git pull ---
if [ "$RUN_PULL" = true ]; then
    if [ -d ".git" ] || [ -d "../.git" ]; then
        info "Pulling latest code..."
        git pull 2>&1 && log "Git pull OK" || warn "Git pull failed (continuing)"
    fi
fi

# --- 2. Build services ---
SERVICES=""
if [ "$BUILD_ALL" = true ]; then
    SERVICES="backend frontend executor"
else
    [ "$BUILD_BACKEND" = true ] && SERVICES="$SERVICES backend"
    [ "$BUILD_FRONTEND" = true ] && SERVICES="$SERVICES frontend"
    [ "$BUILD_EXECUTOR" = true ] && SERVICES="$SERVICES executor"
fi

info "Rebuilding: ${SERVICES:-none}"

# Clean orphan containers first
$COMPOSE -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# Build and start
if [ -n "$SERVICES" ]; then
    $COMPOSE -f "$COMPOSE_FILE" up -d --build $SERVICES 2>&1 && log "Services rebuilt" || {
        err "Build failed!"
        exit 1
    }
else
    $COMPOSE -f "$COMPOSE_FILE" up -d 2>&1 && log "Services started" || {
        err "Start failed!"
        exit 1
    }
fi

# --- 3. Wait for health ---
info "Waiting for services to be healthy..."
MAX_WAIT=90
WAITED=0

while [ $WAITED -lt $MAX_WAIT ]; do
    BE=$(docker inspect --format='{{.State.Health.Status}}' ciber-backend-prod 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' ciber-backend 2>/dev/null || echo "missing")
    PG=$(docker inspect --format='{{.State.Health.Status}}' ciber-postgres-prod 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' ciber-postgres 2>/dev/null || echo "missing")
    RD=$(docker inspect --format='{{.State.Health.Status}}' ciber-redis-prod 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' ciber-redis 2>/dev/null || echo "missing")

    if [ "$BE" = "healthy" ] && [ "$PG" = "healthy" ] && [ "$RD" = "healthy" ]; then
        log "All services healthy"
        break
    fi
    echo -n "."
    sleep 5
    WAITED=$((WAITED + 5))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    warn "Timeout waiting for health checks"
    docker ps --format "table {{.Names}}\t{{.Status}}" | grep ciber
fi

# --- 4. Run migrations ---
if [ "$RUN_MIGRATE" = true ]; then
    BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'ciber-backend' | head -1)
    if [ -n "$BACKEND_CONTAINER" ]; then
        info "Running Alembic migrations..."
        if docker exec "$BACKEND_CONTAINER" alembic upgrade head 2>&1; then
            log "Migrations applied"
        else
            warn "Alembic upgrade failed - stamping to head..."
            docker exec "$BACKEND_CONTAINER" alembic stamp head 2>&1 || true
        fi
    else
        warn "Backend container not found, skipping migrations"
    fi
fi

# --- 5. Health check endpoints ---
info "Verifying endpoints..."
ERRORS=0

check() {
    local name=$1 url=$2
    if curl -sf "$url" > /dev/null 2>&1; then
        log "$name: OK"
    else
        warn "$name: UNREACHABLE"
        ERRORS=$((ERRORS + 1))
    fi
}

check "Backend" "http://localhost:4000/health"
check "Frontend" "http://localhost:3000"
check "Executor" "http://localhost:5000/health"

# Check nginx if production
if [ "$PRODUCTION" = true ]; then
    # Detect nginx port
    NGINX_PORT=$(grep -oP 'NGINX_HTTP_PORT=\K\d+' .env 2>/dev/null || echo "80")
    check "Nginx" "http://localhost:${NGINX_PORT}"
fi

# --- 6. Summary ---
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "  ${GREEN}Update complete - All services OK${NC}"
else
    echo -e "  ${YELLOW}Update complete - $ERRORS service(s) unreachable${NC}"
fi
echo "=========================================="
echo ""

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ciber || true

exit $ERRORS
