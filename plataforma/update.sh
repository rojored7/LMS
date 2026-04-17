#!/usr/bin/env bash
set -e

# ============================================================
# update.sh - Actualizar plataforma LMS preservando datos
#
# Uso:
#   ./update.sh                # Actualizar todo (preserva DB)
#   ./update.sh --backend      # Solo rebuild backend
#   ./update.sh --frontend     # Solo rebuild frontend
#   ./update.sh --executor     # Solo rebuild executor
#   ./update.sh --nginx        # Solo rebuild nginx
#   ./update.sh --reset-db     # DESTRUCTIVO: borra DB y recrea desde cero
#
# Requisitos: Docker Compose, git
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

# Detectar compose
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
elif docker-compose --version &>/dev/null; then
    COMPOSE="docker-compose"
else
    error "Docker Compose no encontrado"
fi

# Parsear argumentos
TARGET=""
RESET_DB=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)   TARGET="backend"; shift ;;
        --frontend)  TARGET="frontend"; shift ;;
        --executor)  TARGET="executor"; shift ;;
        --nginx)     TARGET="nginx"; shift ;;
        --reset-db)  RESET_DB=true; shift ;;
        --force|-f)  FORCE=true; shift ;;
        --help|-h)
            echo "Uso: ./update.sh [opciones]"
            echo ""
            echo "Opciones:"
            echo "  (default)       Actualizar todo preservando datos"
            echo "  --backend       Solo rebuild backend"
            echo "  --frontend      Solo rebuild frontend"
            echo "  --executor      Solo rebuild executor"
            echo "  --nginx         Solo rebuild nginx"
            echo "  --reset-db      DESTRUCTIVO: borra DB y recrea desde cero"
            echo "  --force         No pedir confirmacion"
            echo "  --help          Mostrar esta ayuda"
            exit 0
            ;;
        *) warn "Argumento desconocido: $1"; shift ;;
    esac
done

echo ""
echo "========================================"
echo "  Plataforma LMS - Actualizacion"
echo "========================================"
echo ""

# ----------------------------------------------------------
# 1. Git pull
# ----------------------------------------------------------
info "Descargando cambios del repositorio..."

if git rev-parse --is-inside-work-tree &>/dev/null; then
    BEFORE=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    git pull origin master 2>/dev/null && log "Codigo actualizado" || warn "No se pudo hacer git pull (cambios locales?)"
    AFTER=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    if [ "$BEFORE" = "$AFTER" ]; then
        info "Sin cambios nuevos en el repositorio"
    else
        COMMITS=$(git log --oneline ${BEFORE}..${AFTER} 2>/dev/null | wc -l)
        log "$COMMITS commits nuevos descargados"
    fi
else
    warn "No es un repositorio git. Saltando pull."
fi

# ----------------------------------------------------------
# 2. Backup de DB (siempre, antes de cualquier cambio)
# ----------------------------------------------------------
info "Creando backup de la base de datos..."

BACKUP_DIR="database/backups"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"

if $COMPOSE exec -T postgres pg_dump -U "${DB_USER:-ciber_admin}" "${DB_NAME:-ciber_platform}" > "$BACKUP_FILE" 2>/tmp/pg_dump_err; then
    if [ -s "$BACKUP_FILE" ] && head -5 "$BACKUP_FILE" | grep -q "PostgreSQL database dump"; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Backup creado: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        rm -f "$BACKUP_FILE"
        warn "Backup vacio o invalido (DB sin datos?)"
    fi
else
    rm -f "$BACKUP_FILE" /tmp/pg_dump_err
    warn "pg_dump fallo (servicio no disponible?)"
fi

# Mantener solo los ultimos 5 backups
ls -t "$BACKUP_DIR"/backup_*.sql 2>/dev/null | tail -n +6 | xargs -r rm -f

# ----------------------------------------------------------
# 3. Reset DB (solo si --reset-db)
# ----------------------------------------------------------
if [ "$RESET_DB" = true ]; then
    echo ""
    echo -e "${RED}ATENCION: Esto BORRARA todos los datos de la base de datos.${NC}"
    echo -e "${RED}Usuarios, cursos, inscripciones, progreso - TODO se perdera.${NC}"
    echo ""

    if [ "$FORCE" = false ]; then
        read -p "Escriba 'BORRAR' para confirmar: " CONFIRM
        if [ "$CONFIRM" != "BORRAR" ]; then
            echo "Cancelado."
            exit 0
        fi
    fi

    info "Reseteando base de datos..."
    $COMPOSE down -v 2>/dev/null
    log "Servicios detenidos y volumenes eliminados"

    info "Reconstruyendo servicios..."
    $COMPOSE up -d --build
    log "Servicios reconstruidos"

    # Esperar health
    info "Esperando servicios..."
    sleep 15

    # Migraciones + seed
    info "Creando tablas..."
    $COMPOSE exec -T backend python -m alembic upgrade head 2>/dev/null && log "Tablas creadas via migraciones" || {
        warn "Alembic fallo, usando fallback..."
        $COMPOSE exec -T backend python -c "
from app.database import _engine, Base
from app.models.user import *
from app.models.course import *
from app.models.progress import *
from app.models.assessment import *
from app.models.gamification import *
from app.models.content import *
import asyncio
async def create():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(create())
" 2>/dev/null && log "Tablas creadas via fallback"
        $COMPOSE exec -T backend python -m alembic stamp head 2>/dev/null
    }

    ADMIN_PASS="Admin$(openssl rand -hex 4 2>/dev/null || echo 'Sec9x7!')!"
    $COMPOSE exec -T -e ADMIN_SEED_PASSWORD="$ADMIN_PASS" backend python -m app.scripts.seed_base 2>/dev/null && log "Seed completado"

    echo "admin@ciber.local:$ADMIN_PASS" > .admin-credentials
    chmod 600 .admin-credentials
    log "Credenciales guardadas en .admin-credentials"

    echo ""
    echo -e "${GREEN}DB reseteada.${NC} Admin: admin@ciber.local / $ADMIN_PASS"
    echo ""
    exit 0
fi

# ----------------------------------------------------------
# 4. Rebuild servicios (preservando volumenes)
# ----------------------------------------------------------
if [ -n "$TARGET" ]; then
    info "Reconstruyendo servicio: $TARGET"
    $COMPOSE up -d --build "$TARGET"
    log "Servicio $TARGET reconstruido"
else
    info "Reconstruyendo todos los servicios..."
    $COMPOSE up -d --build
    log "Todos los servicios reconstruidos"
fi

# ----------------------------------------------------------
# 5. Esperar health checks
# ----------------------------------------------------------
info "Esperando a que los servicios esten saludables..."

MAX_WAIT=90
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    BE_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-backend 2>/dev/null || echo "missing")
    if [ "$BE_OK" = "healthy" ]; then
        log "Backend saludable"
        break
    fi
    echo -n "."
    sleep 5
    WAITED=$((WAITED + 5))
done
echo ""

# ----------------------------------------------------------
# 6. Migraciones (solo aplica nuevas, preserva datos)
# ----------------------------------------------------------
info "Aplicando migraciones de base de datos..."

MIGRATION_OUTPUT=$($COMPOSE exec -T backend python -m alembic upgrade head 2>&1)
if echo "$MIGRATION_OUTPUT" | grep -q "Running upgrade"; then
    MIGRATION_COUNT=$(echo "$MIGRATION_OUTPUT" | grep -c "Running upgrade")
    log "$MIGRATION_COUNT migracion(es) aplicada(s)"
else
    log "Sin migraciones nuevas - esquema actualizado"
fi

# ----------------------------------------------------------
# 7. Verificacion
# ----------------------------------------------------------
info "Verificando servicios..."

echo ""
HEALTH_BE=$(curl -sf http://localhost:4000/health 2>/dev/null | grep -o '"ok"' || echo "FAIL")
HEALTH_NX=$(curl -sf http://localhost/api/health 2>/dev/null | grep -o '"ok"' || curl -sf http://localhost:8080/health 2>/dev/null | grep -o '"healthy"' || echo "FAIL")

# Contar datos preservados
USER_COUNT=$($COMPOSE exec -T postgres psql -U "${DB_USER:-ciber_admin}" -d "${DB_NAME:-ciber_platform}" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "?")
COURSE_COUNT=$($COMPOSE exec -T postgres psql -U "${DB_USER:-ciber_admin}" -d "${DB_NAME:-ciber_platform}" -t -c "SELECT COUNT(*) FROM courses;" 2>/dev/null | tr -d ' ' || echo "?")
ENROLLMENT_COUNT=$($COMPOSE exec -T postgres psql -U "${DB_USER:-ciber_admin}" -d "${DB_NAME:-ciber_platform}" -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "?")

echo "  Backend:     $([ "$HEALTH_BE" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo "  Nginx:       $([ "$HEALTH_NX" != "FAIL" ] && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}")"
echo ""
echo "  Datos preservados:"
echo "    Usuarios:      $USER_COUNT"
echo "    Cursos:         $COURSE_COUNT"
echo "    Inscripciones:  $ENROLLMENT_COUNT"

# ----------------------------------------------------------
# 8. Resumen
# ----------------------------------------------------------
echo ""
echo "========================================"
echo -e "  ${GREEN}Actualizacion completada${NC}"
echo "========================================"
echo ""
if [ -n "$TARGET" ]; then
    echo "  Servicio actualizado: $TARGET"
else
    echo "  Todos los servicios actualizados"
fi
echo "  Datos de usuarios y cursos preservados"
echo "  Backup: ${BACKUP_FILE:-ninguno}"
echo ""
