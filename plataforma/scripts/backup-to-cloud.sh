#!/bin/bash
#
# Cloud Backup Script
# ===================
# Respalda PostgreSQL, Redis y volúmenes Docker a almacenamiento en la nube
#
# Soporta:
# - AWS S3
# - Azure Blob Storage
# - Google Cloud Storage
# - Local filesystem (para testing)
#
# Uso:
#   ./scripts/backup-to-cloud.sh                    # Backup completo
#   ./scripts/backup-to-cloud.sh --db-only          # Solo base de datos
#   ./scripts/backup-to-cloud.sh --volumes-only     # Solo volúmenes
#   ./scripts/backup-to-cloud.sh --verify           # Verificar backups existentes
#
# Configuración vía variables de entorno:
#   BACKUP_PROVIDER=s3|azure|gcs|local
#   S3_BUCKET, S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
#   AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY, AZURE_CONTAINER
#   GCS_BUCKET, GOOGLE_APPLICATION_CREDENTIALS
#   BACKUP_RETENTION_DAYS=30
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
BACKUP_DIR="$PROJECT_ROOT/database/backups"
TEMP_DIR="/tmp/ciber-backups-$$"

# Opciones
DB_ONLY=false
VOLUMES_ONLY=false
VERIFY_MODE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --db-only)
      DB_ONLY=true
      ;;
    --volumes-only)
      VOLUMES_ONLY=true
      ;;
    --verify)
      VERIFY_MODE=true
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

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

log_section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo ""
}

# ==========================================
# 0. VALIDAR CONFIGURACIÓN
# ==========================================

validate_configuration() {
  log_section "VALIDANDO CONFIGURACIÓN"

  # Variables obligatorias
  if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    log_error "Variables DB_USER o DB_NAME no configuradas"
    exit 1
  fi

  # Backup provider
  BACKUP_PROVIDER=${BACKUP_PROVIDER:-local}
  log "Proveedor de backup: $BACKUP_PROVIDER"

  case $BACKUP_PROVIDER in
    s3)
      if [ -z "$S3_BUCKET" ] || [ -z "$AWS_ACCESS_KEY_ID" ]; then
        log_error "S3 no configurado correctamente"
        log "Variables requeridas: S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
        exit 1
      fi
      log_success "AWS S3 configurado: $S3_BUCKET"
      ;;
    azure)
      if [ -z "$AZURE_STORAGE_ACCOUNT" ] || [ -z "$AZURE_CONTAINER" ]; then
        log_error "Azure Blob Storage no configurado correctamente"
        log "Variables requeridas: AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_KEY, AZURE_CONTAINER"
        exit 1
      fi
      log_success "Azure Blob Storage configurado: $AZURE_CONTAINER"
      ;;
    gcs)
      if [ -z "$GCS_BUCKET" ] || [ -z "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
        log_error "Google Cloud Storage no configurado correctamente"
        log "Variables requeridas: GCS_BUCKET, GOOGLE_APPLICATION_CREDENTIALS"
        exit 1
      fi
      log_success "Google Cloud Storage configurado: $GCS_BUCKET"
      ;;
    local)
      log_warning "Modo local - backups NO suben a la nube"
      log "Para producción, configurar BACKUP_PROVIDER=s3|azure|gcs"
      ;;
    *)
      log_error "Proveedor no soportado: $BACKUP_PROVIDER"
      exit 1
      ;;
  esac

  # Retención
  BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
  log "Retención de backups: $BACKUP_RETENTION_DAYS días"

  # Crear directorios
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$TEMP_DIR"
}

# ==========================================
# 1. BACKUP DE POSTGRESQL
# ==========================================

backup_postgresql() {
  log_section "1. BACKUP DE POSTGRESQL"

  local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  local BACKUP_FILE="$TEMP_DIR/postgres_${TIMESTAMP}.sql.gz"

  log "Creando dump de PostgreSQL..."

  # Obtener estadísticas pre-backup
  local USERS_COUNT=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  local COURSES_COUNT=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM courses;" 2>/dev/null | tr -d ' ' || echo "0")
  local ENROLLMENTS_COUNT=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "0")

  log "Base de datos:"
  log "  - Usuarios: $USERS_COUNT"
  log "  - Cursos: $COURSES_COUNT"
  log "  - Inscripciones: $ENROLLMENTS_COUNT"

  # Crear backup
  if docker exec ciber-postgres-prod pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"; then
    log_success "Dump creado: $BACKUP_FILE"
  else
    log_error "Fallo al crear dump"
    return 1
  fi

  # Verificar integridad
  if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup verificado: $SIZE"
  else
    log_error "Backup corrupto"
    rm -f "$BACKUP_FILE"
    return 1
  fi

  # Crear metadata
  cat > "$TEMP_DIR/postgres_${TIMESTAMP}.meta.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "database": "$DB_NAME",
  "users_count": $USERS_COUNT,
  "courses_count": $COURSES_COUNT,
  "enrollments_count": $ENROLLMENTS_COUNT,
  "size_bytes": $(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE"),
  "compressed": true,
  "format": "sql",
  "backup_script_version": "1.0.0"
}
EOF

  log_success "Backup de PostgreSQL completado"
  export POSTGRES_BACKUP_FILE="$BACKUP_FILE"
  export POSTGRES_BACKUP_META="$TEMP_DIR/postgres_${TIMESTAMP}.meta.json"
}

# ==========================================
# 2. BACKUP DE REDIS
# ==========================================

backup_redis() {
  log_section "2. BACKUP DE REDIS"

  local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  local BACKUP_FILE="$TEMP_DIR/redis_${TIMESTAMP}.rdb"

  log "Creando snapshot de Redis..."

  # Forzar save de Redis
  docker exec ciber-redis-prod redis-cli --no-auth-warning -a "$REDIS_PASSWORD" BGSAVE > /dev/null 2>&1

  # Esperar a que termine el save
  sleep 2

  # Obtener estadísticas
  local KEYS_COUNT=$(docker exec ciber-redis-prod redis-cli --no-auth-warning -a "$REDIS_PASSWORD" DBSIZE | grep -oE '[0-9]+' || echo "0")

  log "Redis:"
  log "  - Keys: $KEYS_COUNT"

  # Copiar dump.rdb
  if docker cp ciber-redis-prod:/data/dump.rdb "$BACKUP_FILE" 2>/dev/null; then
    log_success "Snapshot copiado: $BACKUP_FILE"
  else
    log_warning "No se pudo copiar dump de Redis (puede no existir)"
    return 0  # No crítico
  fi

  # Comprimir
  if [ -f "$BACKUP_FILE" ]; then
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"

    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Redis backup: $SIZE"
  fi

  export REDIS_BACKUP_FILE="$BACKUP_FILE"
}

# ==========================================
# 3. BACKUP DE VOLÚMENES DOCKER
# ==========================================

backup_docker_volumes() {
  log_section "3. BACKUP DE VOLÚMENES DOCKER"

  local TIMESTAMP=$(date +%Y%m%d_%H%M%S)

  # Volúmenes críticos
  local VOLUMES=(
    "plataforma_backend_uploads"
    "plataforma_backend_public"
  )

  for VOLUME in "${VOLUMES[@]}"; do
    log "Respaldando volumen: $VOLUME"

    local BACKUP_FILE="$TEMP_DIR/${VOLUME}_${TIMESTAMP}.tar.gz"

    # Crear backup del volumen usando un contenedor temporal
    if docker run --rm \
      -v "$VOLUME:/volume" \
      -v "$TEMP_DIR:/backup" \
      alpine \
      tar czf "/backup/$(basename $BACKUP_FILE)" -C /volume . 2>/dev/null; then

      local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
      log_success "$VOLUME respaldado: $SIZE"
    else
      log_warning "Fallo al respaldar $VOLUME"
    fi
  done

  log_success "Volúmenes respaldados"
}

# ==========================================
# 4. UPLOAD A LA NUBE
# ==========================================

upload_to_s3() {
  local FILE=$1
  local REMOTE_PATH=$2

  if command -v aws &> /dev/null; then
    aws s3 cp "$FILE" "s3://${S3_BUCKET}/${REMOTE_PATH}" --region "${S3_REGION:-us-east-1}"
    return $?
  else
    log_error "AWS CLI no instalado"
    return 1
  fi
}

upload_to_azure() {
  local FILE=$1
  local REMOTE_PATH=$2

  if command -v az &> /dev/null; then
    az storage blob upload \
      --account-name "$AZURE_STORAGE_ACCOUNT" \
      --container-name "$AZURE_CONTAINER" \
      --name "$REMOTE_PATH" \
      --file "$FILE" \
      --auth-mode key \
      --account-key "$AZURE_STORAGE_KEY"
    return $?
  else
    log_error "Azure CLI no instalado"
    return 1
  fi
}

upload_to_gcs() {
  local FILE=$1
  local REMOTE_PATH=$2

  if command -v gsutil &> /dev/null; then
    gsutil cp "$FILE" "gs://${GCS_BUCKET}/${REMOTE_PATH}"
    return $?
  else
    log_error "Google Cloud SDK no instalado"
    return 1
  fi
}

upload_to_cloud() {
  log_section "4. UPLOAD A LA NUBE"

  if [ "$BACKUP_PROVIDER" = "local" ]; then
    log "Copiando backups a directorio local..."
    cp -v "$TEMP_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
    log_success "Backups guardados localmente en: $BACKUP_DIR"
    return 0
  fi

  local UPLOAD_COUNT=0
  local FAILED_COUNT=0

  for FILE in "$TEMP_DIR"/*; do
    [ -f "$FILE" ] || continue

    local FILENAME=$(basename "$FILE")
    local REMOTE_PATH="backups/$(date +%Y/%m)/$FILENAME"

    log "Subiendo: $FILENAME"

    case $BACKUP_PROVIDER in
      s3)
        if upload_to_s3 "$FILE" "$REMOTE_PATH"; then
          log_success "Subido a S3: $REMOTE_PATH"
          ((UPLOAD_COUNT++))
        else
          log_error "Fallo al subir a S3: $FILENAME"
          ((FAILED_COUNT++))
        fi
        ;;
      azure)
        if upload_to_azure "$FILE" "$REMOTE_PATH"; then
          log_success "Subido a Azure: $REMOTE_PATH"
          ((UPLOAD_COUNT++))
        else
          log_error "Fallo al subir a Azure: $FILENAME"
          ((FAILED_COUNT++))
        fi
        ;;
      gcs)
        if upload_to_gcs "$FILE" "$REMOTE_PATH"; then
          log_success "Subido a GCS: $REMOTE_PATH"
          ((UPLOAD_COUNT++))
        else
          log_error "Fallo al subir a GCS: $FILENAME"
          ((FAILED_COUNT++))
        fi
        ;;
    esac
  done

  log_success "Archivos subidos: $UPLOAD_COUNT"
  if [ $FAILED_COUNT -gt 0 ]; then
    log_warning "Archivos con errores: $FAILED_COUNT"
  fi
}

# ==========================================
# 5. CLEANUP DE BACKUPS ANTIGUOS
# ==========================================

cleanup_old_backups() {
  log_section "5. CLEANUP DE BACKUPS ANTIGUOS"

  # Cleanup local
  log "Eliminando backups locales antiguos (> $BACKUP_RETENTION_DAYS días)..."

  find "$BACKUP_DIR" -type f -name "*.gz" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true
  find "$BACKUP_DIR" -type f -name "*.json" -mtime +$BACKUP_RETENTION_DAYS -delete 2>/dev/null || true

  local REMAINING=$(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')
  log_success "Backups locales restantes: $REMAINING"

  # Cleanup cloud (si está configurado)
  case $BACKUP_PROVIDER in
    s3)
      log "Configurando lifecycle policy en S3..."
      # Lifecycle policy debería estar configurado en S3 directamente
      log_success "Usar AWS S3 lifecycle policies para gestión automática"
      ;;
    azure|gcs)
      log_success "Usar lifecycle management del proveedor cloud"
      ;;
  esac
}

# ==========================================
# 6. VERIFICACIÓN DE BACKUPS
# ==========================================

verify_backups() {
  log_section "VERIFICACIÓN DE BACKUPS"

  log "Verificando backups locales..."

  local BACKUP_COUNT=$(find "$BACKUP_DIR" -type f -name "*.gz" -mtime -7 | wc -l | tr -d ' ')

  if [ $BACKUP_COUNT -eq 0 ]; then
    log_error "No se encontraron backups recientes (últimos 7 días)"
    return 1
  fi

  log_success "Backups recientes encontrados: $BACKUP_COUNT"

  # Verificar el backup más reciente
  local LATEST_BACKUP=$(find "$BACKUP_DIR" -type f -name "postgres_*.sql.gz" -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2)

  if [ -n "$LATEST_BACKUP" ]; then
    log "Último backup de PostgreSQL: $(basename $LATEST_BACKUP)"

    if gunzip -t "$LATEST_BACKUP" 2>/dev/null; then
      log_success "Integridad verificada"
    else
      log_error "Backup corrupto: $LATEST_BACKUP"
      return 1
    fi
  fi

  return 0
}

# ==========================================
# MAIN
# ==========================================

main() {
  log_section "☁️  CLOUD BACKUP SCRIPT"

  # Paso 0: Validar configuración
  validate_configuration || exit 1

  # Modo verificación
  if [ "$VERIFY_MODE" = true ]; then
    verify_backups
    exit $?
  fi

  # Paso 1: Backup PostgreSQL
  if [ "$VOLUMES_ONLY" = false ]; then
    backup_postgresql || exit 1
  fi

  # Paso 2: Backup Redis
  if [ "$VOLUMES_ONLY" = false ]; then
    backup_redis || log_warning "Redis backup falló (no crítico)"
  fi

  # Paso 3: Backup volúmenes
  if [ "$DB_ONLY" = false ]; then
    backup_docker_volumes || exit 1
  fi

  # Paso 4: Upload a la nube
  upload_to_cloud || exit 1

  # Paso 5: Cleanup
  cleanup_old_backups

  # Cleanup temporal
  log "Limpiando archivos temporales..."
  rm -rf "$TEMP_DIR"

  # Éxito!
  log_section "✅ BACKUP COMPLETADO"

  log_success "Backups creados y subidos exitosamente"
  log "Proveedor: $BACKUP_PROVIDER"
  log "Retención: $BACKUP_RETENTION_DAYS días"

  return 0
}

# Ejecutar main
main "$@"
