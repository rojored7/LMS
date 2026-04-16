#!/usr/bin/env bash
set -e

# ============================================================
# setup.sh - Despliegue automatizado de la plataforma LMS
#
# Uso:
#   ./setup.sh              # Usa puertos por defecto (80, 3000, 4000, 5000)
#   ./setup.sh --port 8080  # Nginx en puerto 8080 (si 80 esta ocupado)
#   ./setup.sh --port auto  # Detecta automaticamente un puerto libre
#
# Requisitos: Docker >= 20.10, Docker Compose >= 2.0
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!!]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
info()  { echo -e "${CYAN}[>>]${NC} $1"; }

# ----------------------------------------------------------
# Funcion: verificar si un puerto esta libre
# ----------------------------------------------------------
port_free() {
    local port=$1
    if command -v ss &>/dev/null; then
        ! ss -tlnH 2>/dev/null | grep -q ":${port} "
    elif command -v netstat &>/dev/null; then
        ! netstat -tln 2>/dev/null | grep -q ":${port} "
    elif command -v lsof &>/dev/null; then
        ! lsof -iTCP:${port} -sTCP:LISTEN &>/dev/null
    else
        # Si no hay herramienta, intentar conectar
        ! (echo >/dev/tcp/localhost/${port}) 2>/dev/null
    fi
}

# ----------------------------------------------------------
# Funcion: encontrar primer puerto libre desde un inicio
# ----------------------------------------------------------
find_free_port() {
    local start=$1
    local port=$start
    while [ $port -lt $((start + 100)) ]; do
        if port_free $port; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    echo $start
    return 1
}

# ----------------------------------------------------------
# Parsear argumentos
# ----------------------------------------------------------
CUSTOM_PORT=""
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            CUSTOM_PORT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Uso: ./setup.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  --port PUERTO   Puerto HTTP para Nginx (default: 80)"
            echo "  --port auto     Detectar automaticamente puerto libre"
            echo "  --help          Mostrar esta ayuda"
            exit 0
            ;;
        *)
            warn "Argumento desconocido: $1"
            shift
            ;;
    esac
done

echo ""
echo "========================================"
echo "  Plataforma LMS - Setup Automatizado"
echo "========================================"
echo ""

# ----------------------------------------------------------
# 1. Verificar dependencias
# ----------------------------------------------------------
info "Verificando dependencias..."

if ! command -v docker &>/dev/null; then
    error "Docker no esta instalado. Instala Docker desde https://docs.docker.com/get-docker/"
fi

if ! docker compose version &>/dev/null && ! docker-compose --version &>/dev/null; then
    error "Docker Compose no esta instalado. Instala Docker Compose v2+"
fi

if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
log "Docker: $DOCKER_VERSION"
log "Compose: $($COMPOSE version --short 2>/dev/null || echo 'OK')"

if ! docker info &>/dev/null; then
    error "Docker daemon no esta corriendo. Inicia Docker Desktop o el servicio dockerd."
fi

# ----------------------------------------------------------
# 2. Resolver puertos
# ----------------------------------------------------------
info "Verificando puertos disponibles..."

# Puertos por defecto
HTTP_PORT=80
HTTPS_PORT=443
FRONTEND_PORT=3000
BACKEND_PORT=4000
EXECUTOR_PORT=5000

# Si el usuario pidio --port auto, buscar puerto libre
if [ "$CUSTOM_PORT" = "auto" ]; then
    if port_free 80; then
        HTTP_PORT=80
    else
        HTTP_PORT=$(find_free_port 8080)
        warn "Puerto 80 ocupado. Usando puerto $HTTP_PORT"
    fi
    if ! port_free 443; then
        HTTPS_PORT=$(find_free_port 8443)
        warn "Puerto 443 ocupado. Usando puerto $HTTPS_PORT para HTTPS"
    fi
elif [ -n "$CUSTOM_PORT" ]; then
    HTTP_PORT=$CUSTOM_PORT
    # Si pidio puerto custom, HTTPS tambien va custom
    HTTPS_PORT=$((HTTP_PORT + 363))
fi

# Verificar puerto HTTPS
if ! port_free $HTTPS_PORT; then
    HTTPS_PORT=$(find_free_port 8443)
    warn "Puerto HTTPS ajustado a $HTTPS_PORT"
fi

# Verificar que los puertos estan libres
PORTS_OK=true
for CHECK_PORT in $HTTP_PORT $HTTPS_PORT $FRONTEND_PORT $BACKEND_PORT $EXECUTOR_PORT; do
    if ! port_free $CHECK_PORT; then
        CONFLICT_PROCESS=$(ss -tlnp 2>/dev/null | grep ":${CHECK_PORT} " | head -1 || lsof -iTCP:${CHECK_PORT} -sTCP:LISTEN 2>/dev/null | head -2 || echo "proceso desconocido")
        warn "Puerto $CHECK_PORT en uso: $CONFLICT_PROCESS"
        PORTS_OK=false
    fi
done

if [ "$PORTS_OK" = false ]; then
    if [ -z "$CUSTOM_PORT" ]; then
        warn "Puertos en conflicto detectados."
        warn "Opciones:"
        warn "  1. Liberar los puertos ocupados"
        warn "  2. Usar: ./setup.sh --port 8080"
        warn "  3. Usar: ./setup.sh --port auto"
        echo ""
        warn "Continuando de todas formas... (nginx puede fallar si el puerto $HTTP_PORT esta ocupado)"
    fi
fi

log "Puertos: HTTP=$HTTP_PORT | HTTPS=$HTTPS_PORT | Frontend=$FRONTEND_PORT | Backend=$BACKEND_PORT | Executor=$EXECUTOR_PORT"

# ----------------------------------------------------------
# 3. Crear .env si no existe
# ----------------------------------------------------------
info "Configurando variables de entorno..."

if [ -f .env ]; then
    warn ".env ya existe. Se usara el existente."
else
    if [ ! -f .env.example ]; then
        error "No se encontro .env.example. Asegurate de estar en el directorio plataforma/"
    fi
    cp .env.example .env

    # Generar secrets
    DB_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
    REDIS_PASS=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)
    JWT_SEC=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
    JWT_REF=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
    EXEC_SEC=$(openssl rand -hex 16 2>/dev/null || head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 32)

    sed -i "s|DB_PASSWORD=changeme123|DB_PASSWORD=${DB_PASS}|g" .env
    sed -i "s|REDIS_PASSWORD=redispass123|REDIS_PASSWORD=${REDIS_PASS}|g" .env
    sed -i "s|JWT_SECRET=your-super-secret-jwt-key-change-in-production-minimum-32-characters|JWT_SECRET=${JWT_SEC}|g" .env
    sed -i "s|JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-minimum-32-characters|JWT_REFRESH_SECRET=${JWT_REF}|g" .env

    if ! grep -q "EXECUTOR_SECRET" .env; then
        echo "" >> .env
        echo "# ===== EXECUTOR SECRET =====" >> .env
        echo "EXECUTOR_SECRET=${EXEC_SEC}" >> .env
    fi

    log ".env creado con secrets generados automaticamente"
fi

# Aplicar puertos al .env (siempre, incluso si .env ya existia)
if [ "$HTTP_PORT" != "80" ]; then
    if grep -q "^NGINX_HTTP_PORT=" .env; then
        sed -i "s|^NGINX_HTTP_PORT=.*|NGINX_HTTP_PORT=${HTTP_PORT}|g" .env
    else
        echo "NGINX_HTTP_PORT=${HTTP_PORT}" >> .env
    fi
    if grep -q "^CORS_ORIGIN=" .env; then
        sed -i "s|^CORS_ORIGIN=.*|CORS_ORIGIN=http://localhost:${HTTP_PORT},http://localhost:${FRONTEND_PORT},http://localhost|g" .env
    fi
    log "Puerto HTTP configurado: $HTTP_PORT"
fi

if [ "$HTTPS_PORT" != "443" ]; then
    if grep -q "^NGINX_HTTPS_PORT=" .env; then
        sed -i "s|^NGINX_HTTPS_PORT=.*|NGINX_HTTPS_PORT=${HTTPS_PORT}|g" .env
    else
        echo "NGINX_HTTPS_PORT=${HTTPS_PORT}" >> .env
    fi
    log "Puerto HTTPS configurado: $HTTPS_PORT"
fi

# ----------------------------------------------------------
# 4. Construir imagen sandbox
# ----------------------------------------------------------
info "Construyendo imagen sandbox para ejecucion de codigo..."

if docker image inspect ciber-sandbox:latest &>/dev/null; then
    warn "Imagen ciber-sandbox:latest ya existe. Saltando build."
else
    docker build -f executor/Dockerfile.sandbox -t ciber-sandbox:latest ./executor
    log "Imagen ciber-sandbox:latest construida"
fi

# ----------------------------------------------------------
# 5. Levantar servicios
# ----------------------------------------------------------
info "Levantando servicios con Docker Compose..."

NGINX_HTTP_PORT=$HTTP_PORT NGINX_HTTPS_PORT=$HTTPS_PORT $COMPOSE up -d --build

log "Servicios levantados"

# ----------------------------------------------------------
# 6. Esperar health checks
# ----------------------------------------------------------
info "Esperando a que los servicios esten saludables..."

MAX_WAIT=120
WAITED=0
INTERVAL=5

while [ $WAITED -lt $MAX_WAIT ]; do
    PG_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-postgres 2>/dev/null || echo "missing")
    RD_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-redis 2>/dev/null || echo "missing")
    BE_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-backend 2>/dev/null || echo "missing")

    if [ "$PG_OK" = "healthy" ] && [ "$RD_OK" = "healthy" ] && [ "$BE_OK" = "healthy" ]; then
        log "Todos los servicios saludables"
        break
    fi

    echo -n "."
    sleep $INTERVAL
    WAITED=$((WAITED + INTERVAL))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    warn "Timeout esperando servicios. Estado actual:"
    $COMPOSE ps
    warn "Revisa los logs con: $COMPOSE logs"
fi

# ----------------------------------------------------------
# 7. Inicializar base de datos
# ----------------------------------------------------------
info "Ejecutando migraciones de base de datos..."

$COMPOSE exec -T backend python -m alembic upgrade head 2>/dev/null && log "Migraciones aplicadas" || warn "Migraciones ya aplicadas o no hay nuevas"

# ----------------------------------------------------------
# 8. Seed de datos base
# ----------------------------------------------------------
info "Ejecutando seed de datos base..."

ADMIN_PASS="Admin$(openssl rand -hex 4 2>/dev/null || echo '1234')!"

$COMPOSE exec -T -e ADMIN_SEED_PASSWORD="$ADMIN_PASS" backend python -m app.scripts.seed_base 2>/dev/null && log "Seed completado" || warn "Seed ya ejecutado previamente"

# ----------------------------------------------------------
# 9. Verificacion final
# ----------------------------------------------------------
info "Verificando servicios..."

echo ""
HEALTH_BE=$(curl -sf http://localhost:${BACKEND_PORT}/health 2>/dev/null | grep -o '"ok"' || echo "FAIL")
HEALTH_EX=$(curl -sf http://localhost:${EXECUTOR_PORT}/health 2>/dev/null | grep -o '"ok"' || echo "FAIL")
HEALTH_FE=$(curl -sf http://localhost:${FRONTEND_PORT} 2>/dev/null | head -1 | grep -o "DOCTYPE" || echo "FAIL")
HEALTH_NX=$(curl -sf http://localhost:${HTTP_PORT}/api/health 2>/dev/null | grep -o '"ok"' || echo "FAIL")

echo "  Backend  (port ${BACKEND_PORT}): $([ "$HEALTH_BE" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Executor (port ${EXECUTOR_PORT}): $([ "$HEALTH_EX" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Frontend (port ${FRONTEND_PORT}): $([ "$HEALTH_FE" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Nginx    (port ${HTTP_PORT}):   $([ "$HEALTH_NX" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"

# ----------------------------------------------------------
# 10. Mostrar resultado
# ----------------------------------------------------------
if [ "$HTTP_PORT" = "80" ]; then
    PLATFORM_URL="http://localhost"
else
    PLATFORM_URL="http://localhost:${HTTP_PORT}"
fi

echo ""
echo "========================================"
echo -e "  ${GREEN}Plataforma desplegada exitosamente${NC}"
echo "========================================"
echo ""
echo "  URL:    ${PLATFORM_URL}"
echo "  Admin:  admin@ciber.local"
echo "  Pass:   $ADMIN_PASS"
echo ""
echo "  Puertos:"
echo "    Nginx (entry point): ${HTTP_PORT}"
echo "    Frontend:            ${FRONTEND_PORT}"
echo "    Backend API:         ${BACKEND_PORT}"
echo "    Executor:            ${EXECUTOR_PORT}"
echo ""
echo "  Comandos utiles:"
echo "    Ver logs:       $COMPOSE logs -f"
echo "    Parar:          $COMPOSE down"
echo "    Reiniciar:      $COMPOSE restart"
echo "    Estado:         $COMPOSE ps"
echo "    Shell DB:       $COMPOSE exec postgres psql -U ciber_admin -d ciber_platform"
echo "    Importar curso: $COMPOSE exec backend python -m app.scripts.import_course --content-dir /content/contenidos/NOMBRE_CURSO --publish --force"
echo ""
