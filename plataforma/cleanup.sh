#!/usr/bin/env bash
set -e

# ============================================================
# cleanup.sh - Limpieza de instalacion de la plataforma LMS
#
# Uso:
#   ./cleanup.sh              # Limpieza suave (para servicios, elimina containers)
#   ./cleanup.sh --full       # Limpieza total (+ volumenes, imagenes, .env)
#   ./cleanup.sh --nuclear    # Elimina TODO incluyendo datos de DB y cache
#
# Requisitos: Docker, Docker Compose
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
    COMPOSE=""
fi

MODE="soft"
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --full)     MODE="full"; shift ;;
        --nuclear)  MODE="nuclear"; shift ;;
        --force|-f) FORCE=true; shift ;;
        --help|-h)
            echo "Uso: ./cleanup.sh [opciones]"
            echo ""
            echo "Modos:"
            echo "  (default)    Limpieza suave: para containers, elimina containers y networks"
            echo "  --full       Limpieza total: + volumenes de datos, imagenes construidas, .env"
            echo "  --nuclear    Elimina TODO: + imagenes base (postgres, redis, node, python, nginx)"
            echo ""
            echo "Opciones:"
            echo "  --force, -f  No pedir confirmacion"
            echo "  --help       Mostrar esta ayuda"
            exit 0
            ;;
        *) warn "Argumento desconocido: $1"; shift ;;
    esac
done

echo ""
echo "========================================"
echo "  Plataforma LMS - Limpieza"
echo "========================================"
echo ""

case $MODE in
    soft)    info "Modo: SUAVE (containers + networks)" ;;
    full)    warn "Modo: COMPLETO (+ volumenes + imagenes + .env)" ;;
    nuclear) warn "Modo: NUCLEAR (elimina absolutamente todo)" ;;
esac
echo ""

# Confirmacion
if [ "$FORCE" = false ]; then
    if [ "$MODE" = "nuclear" ]; then
        echo -e "${RED}ATENCION: Esto eliminara TODOS los datos incluyendo la base de datos.${NC}"
        echo -e "${RED}Los datos de cursos, usuarios y progreso se perderan permanentemente.${NC}"
    elif [ "$MODE" = "full" ]; then
        echo -e "${YELLOW}Esto eliminara volumenes de datos (DB, Redis, uploads, logs) y el .env.${NC}"
    fi
    echo ""
    read -p "Continuar? (s/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
        echo "Cancelado."
        exit 0
    fi
    echo ""
fi

# ----------------------------------------------------------
# Paso 1: Parar y eliminar containers
# ----------------------------------------------------------
info "Parando servicios..."

if [ -n "$COMPOSE" ] && [ -f docker-compose.yml ]; then
    case $MODE in
        soft)
            $COMPOSE down 2>/dev/null && log "Containers y networks eliminados" || warn "No habia servicios corriendo"
            ;;
        full|nuclear)
            $COMPOSE down -v 2>/dev/null && log "Containers, networks y volumenes eliminados" || warn "No habia servicios corriendo"
            ;;
    esac
else
    # Fallback: eliminar containers por nombre directamente
    for CONTAINER in ciber-backend ciber-frontend ciber-executor ciber-nginx ciber-postgres ciber-redis; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
            docker rm -f $CONTAINER 2>/dev/null && log "Container $CONTAINER eliminado"
        fi
    done
fi

# ----------------------------------------------------------
# Paso 2: Eliminar volumenes huerfanos
# ----------------------------------------------------------
if [ "$MODE" = "full" ] || [ "$MODE" = "nuclear" ]; then
    info "Eliminando volumenes..."

    for VOL in plataforma_postgres_data plataforma_redis_data plataforma_backend_uploads plataforma_backend_logs plataforma_nginx_logs; do
        if docker volume ls -q | grep -q "^${VOL}$"; then
            docker volume rm $VOL 2>/dev/null && log "Volumen $VOL eliminado"
        fi
    done

    # Volumenes huerfanos del proyecto
    docker volume ls -q --filter "name=plataforma_" 2>/dev/null | while read vol; do
        docker volume rm "$vol" 2>/dev/null && log "Volumen huerfano $vol eliminado"
    done
fi

# ----------------------------------------------------------
# Paso 3: Eliminar imagenes construidas
# ----------------------------------------------------------
if [ "$MODE" = "full" ] || [ "$MODE" = "nuclear" ]; then
    info "Eliminando imagenes construidas..."

    for IMG in plataforma-backend plataforma-frontend plataforma-executor plataforma-nginx ciber-sandbox; do
        if docker image inspect "${IMG}:latest" &>/dev/null; then
            docker rmi "${IMG}:latest" 2>/dev/null && log "Imagen $IMG eliminada"
        fi
    done
fi

# ----------------------------------------------------------
# Paso 4: Eliminar imagenes base (solo nuclear)
# ----------------------------------------------------------
if [ "$MODE" = "nuclear" ]; then
    info "Eliminando imagenes base..."

    for IMG in postgres:15-alpine redis:7-alpine nginx:1.25-alpine node:20-alpine python:3.12-slim alpine:3.18; do
        if docker image inspect "$IMG" &>/dev/null; then
            docker rmi "$IMG" 2>/dev/null && log "Imagen base $IMG eliminada" || warn "Imagen $IMG en uso por otro container"
        fi
    done
fi

# ----------------------------------------------------------
# Paso 5: Eliminar network
# ----------------------------------------------------------
if docker network ls --format '{{.Name}}' | grep -q "plataforma_ciber-network"; then
    docker network rm plataforma_ciber-network 2>/dev/null && log "Network eliminada" || true
fi

# ----------------------------------------------------------
# Paso 6: Limpiar build cache
# ----------------------------------------------------------
if [ "$MODE" = "nuclear" ]; then
    info "Limpiando build cache de Docker..."
    docker builder prune -f 2>/dev/null && log "Build cache limpiado" || true
fi

# ----------------------------------------------------------
# Paso 7: Eliminar .env (full y nuclear)
# ----------------------------------------------------------
if [ "$MODE" = "full" ] || [ "$MODE" = "nuclear" ]; then
    if [ -f .env ]; then
        rm .env && log ".env eliminado"
    fi
fi

# ----------------------------------------------------------
# Resumen
# ----------------------------------------------------------
echo ""
echo "========================================"
echo -e "  ${GREEN}Limpieza completada${NC}"
echo "========================================"
echo ""

case $MODE in
    soft)
        echo "  Eliminado: containers, networks"
        echo "  Conservado: volumenes (datos), imagenes, .env"
        echo ""
        echo "  Para reinstalar: ./setup.sh"
        ;;
    full)
        echo "  Eliminado: containers, networks, volumenes, imagenes, .env"
        echo "  Conservado: imagenes base de Docker (postgres, redis, node...)"
        echo ""
        echo "  Para reinstalar desde cero: ./setup.sh"
        ;;
    nuclear)
        echo "  Eliminado: TODO (containers, volumenes, imagenes, cache, .env)"
        echo ""
        echo "  Para reinstalar desde cero: ./setup.sh"
        echo "  (Docker descargara todas las imagenes nuevamente)"
        ;;
esac
echo ""
