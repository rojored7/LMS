#!/bin/bash
#
# Docker Volumes Backup Script
# =============================
# Respalda volúmenes Docker específicos del proyecto
#
# Uso:
#   ./scripts/backup-volumes.sh                    # Todos los volúmenes
#   ./scripts/backup-volumes.sh backend_uploads    # Volumen específico
#   ./scripts/backup-volumes.sh --list             # Listar volúmenes
#   ./scripts/backup-volumes.sh --restore <file>   # Restaurar desde backup
#

set -e
set -o pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/database/backups/volumes"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Funciones helper
log() {
  echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC}  $1"
}

# ==========================================
# VOLÚMENES CRÍTICOS DEL PROYECTO
# ==========================================

# Lista de volúmenes a respaldar
CRITICAL_VOLUMES=(
  "plataforma_backend_uploads"       # Archivos subidos por usuarios, proyectos
  "plataforma_backend_public"        # Certificados PDF generados
  "plataforma_backend_logs_blue"     # Logs del entorno blue
  "plataforma_backend_logs_green"    # Logs del entorno green
  "plataforma_postgres_data"         # Datos de PostgreSQL (opcional)
  "plataforma_redis_data"            # Datos de Redis (opcional)
)

# ==========================================
# LISTAR VOLÚMENES
# ==========================================

list_volumes() {
  log "Volúmenes del proyecto:"
  echo ""

  for VOLUME in "${CRITICAL_VOLUMES[@]}"; do
    if docker volume inspect "$VOLUME" &> /dev/null; then
      local SIZE=$(docker run --rm -v "${VOLUME}:/volume" alpine du -sh /volume 2>/dev/null | cut -f1 || echo "unknown")
      echo -e "  ${GREEN}✓${NC} $VOLUME (${SIZE})"
    else
      echo -e "  ${YELLOW}○${NC} $VOLUME (no existe)"
    fi
  done

  echo ""
}

# ==========================================
# BACKUP DE UN VOLUMEN
# ==========================================

backup_single_volume() {
  local VOLUME_NAME=$1

  # Verificar que el volumen existe
  if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    log_error "Volumen no existe: $VOLUME_NAME"
    return 1
  fi

  log "Respaldando volumen: $VOLUME_NAME"

  # Crear directorio de backup
  mkdir -p "$BACKUP_DIR"

  # Nombre del archivo de backup
  local BACKUP_FILE="$BACKUP_DIR/${VOLUME_NAME}_${TIMESTAMP}.tar.gz"

  # Crear backup usando contenedor temporal
  log "Creando archivo tar comprimido..."

  if docker run --rm \
    -v "${VOLUME_NAME}:/volume:ro" \
    -v "${BACKUP_DIR}:/backup" \
    alpine \
    sh -c "cd /volume && tar czf /backup/$(basename $BACKUP_FILE) ." 2>&1; then

    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup creado: $(basename $BACKUP_FILE) ($SIZE)"

    # Crear metadata
    cat > "${BACKUP_FILE}.meta.json" <<EOF
{
  "volume_name": "$VOLUME_NAME",
  "timestamp": "$(date -Iseconds)",
  "size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "backup_file": "$(basename $BACKUP_FILE)"
}
EOF

    log_success "Metadata guardada"

    # Verificar integridad
    if tar tzf "$BACKUP_FILE" > /dev/null 2>&1; then
      log_success "Integridad verificada"
    else
      log_error "Backup corrupto"
      rm -f "$BACKUP_FILE" "${BACKUP_FILE}.meta.json"
      return 1
    fi

    return 0
  else
    log_error "Fallo al crear backup de $VOLUME_NAME"
    return 1
  fi
}

# ==========================================
# BACKUP DE TODOS LOS VOLÚMENES
# ==========================================

backup_all_volumes() {
  log "Iniciando backup de todos los volúmenes críticos..."
  echo ""

  local SUCCESS_COUNT=0
  local FAILED_COUNT=0

  for VOLUME in "${CRITICAL_VOLUMES[@]}"; do
    if backup_single_volume "$VOLUME"; then
      ((SUCCESS_COUNT++))
    else
      ((FAILED_COUNT++))
      log_warning "Continuando con siguiente volumen..."
    fi
    echo ""
  done

  log_success "Backups exitosos: $SUCCESS_COUNT"
  if [ $FAILED_COUNT -gt 0 ]; then
    log_warning "Backups fallidos: $FAILED_COUNT"
  fi

  return 0
}

# ==========================================
# RESTAURAR VOLUMEN DESDE BACKUP
# ==========================================

restore_volume() {
  local BACKUP_FILE=$1

  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Archivo de backup no existe: $BACKUP_FILE"
    return 1
  fi

  # Extraer nombre del volumen del archivo
  local VOLUME_NAME=$(basename "$BACKUP_FILE" | sed -E 's/(.*)_[0-9]{8}_[0-9]{6}\.tar\.gz/\1/')

  log "Restaurando volumen: $VOLUME_NAME"
  log "Desde archivo: $(basename $BACKUP_FILE)"

  # Verificar integridad
  if ! tar tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log_error "Backup corrupto"
    return 1
  fi

  log_success "Backup verificado"

  # Advertencia
  log_warning "ADVERTENCIA: Esto sobrescribirá todos los datos en $VOLUME_NAME"
  log "¿Deseas continuar? (yes/no)"
  read -r CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    log "Restauración cancelada"
    return 0
  fi

  # Verificar si el volumen existe
  if ! docker volume inspect "$VOLUME_NAME" &> /dev/null; then
    log "Creando volumen: $VOLUME_NAME"
    docker volume create "$VOLUME_NAME"
  fi

  # Restaurar datos
  log "Restaurando datos..."

  if docker run --rm \
    -v "${VOLUME_NAME}:/volume" \
    -v "$(dirname $BACKUP_FILE):/backup:ro" \
    alpine \
    sh -c "cd /volume && tar xzf /backup/$(basename $BACKUP_FILE)" 2>&1; then

    log_success "Volumen restaurado exitosamente"

    # Verificar contenido
    local FILE_COUNT=$(docker run --rm -v "${VOLUME_NAME}:/volume" alpine find /volume -type f | wc -l | tr -d ' ')
    log "Archivos restaurados: $FILE_COUNT"

    return 0
  else
    log_error "Fallo al restaurar volumen"
    return 1
  fi
}

# ==========================================
# MAIN
# ==========================================

main() {
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}   DOCKER VOLUMES BACKUP SCRIPT${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo ""

  # Parse argumentos
  if [ $# -eq 0 ]; then
    # Sin argumentos: backup de todos los volúmenes
    backup_all_volumes
    exit $?
  fi

  case "$1" in
    --list)
      list_volumes
      ;;
    --restore)
      if [ -z "$2" ]; then
        log_error "Especificar archivo de backup: --restore <file>"
        exit 1
      fi
      restore_volume "$2"
      ;;
    *)
      # Argumento = nombre de volumen específico
      backup_single_volume "$1"
      ;;
  esac

  exit $?
}

# Ejecutar main
main "$@"
