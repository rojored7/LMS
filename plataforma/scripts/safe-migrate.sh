#!/bin/bash
#
# Safe Database Migration Script
# ===============================
# Aplica migraciones de Prisma con protección contra pérdida de datos
#
# Características:
# - Backup obligatorio pre-migración
# - Dry-run para validar SQL
# - Rollback automático si falla
# - Validación de integridad post-migración
# - Logs detallados
#
# Uso:
#   ./scripts/safe-migrate.sh
#   ./scripts/safe-migrate.sh --preview  # Solo muestra lo que haría
#   ./scripts/safe-migrate.sh --skip-backup  # No recomendado!
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

# Argumentos
PREVIEW_ONLY=false
SKIP_BACKUP=false

for arg in "$@"; do
  case $arg in
    --preview)
      PREVIEW_ONLY=true
      ;;
    --skip-backup)
      SKIP_BACKUP=true
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
# 1. PRE-MIGRATION BACKUP
# ==========================================

create_backup() {
  log_section "1. CREANDO BACKUP PRE-MIGRACIÓN"

  if [ "$SKIP_BACKUP" = true ]; then
    log_warning "Backup omitido (--skip-backup) ⚠️  PELIGROSO"
    return 0
  fi

  mkdir -p "$BACKUP_DIR"

  local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="$BACKUP_DIR/pre-migration_${TIMESTAMP}.sql.gz"

  log "Creando backup de PostgreSQL..."

  # Obtener conteos pre-backup
  USERS_BEFORE=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  ENROLLMENTS_BEFORE=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "0")
  COURSES_BEFORE=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM courses;" 2>/dev/null | tr -d ' ' || echo "0")

  log "Registros actuales:"
  log "  - Usuarios: $USERS_BEFORE"
  log "  - Inscripciones: $ENROLLMENTS_BEFORE"
  log "  - Cursos: $COURSES_BEFORE"

  # Crear backup
  if docker exec ciber-postgres-prod pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"; then
    log_success "Backup creado: $BACKUP_FILE"
  else
    log_error "Fallo al crear backup"
    exit 1
  fi

  # Verificar integridad
  if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    local SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup verificado: $SIZE"
  else
    log_error "Backup corrupto!"
    rm -f "$BACKUP_FILE"
    exit 1
  fi

  export BACKUP_FILE USERS_BEFORE ENROLLMENTS_BEFORE COURSES_BEFORE
}

# ==========================================
# 2. PREVIEW MIGRACIONES (DRY-RUN)
# ==========================================

preview_migrations() {
  log_section "2. VALIDANDO MIGRACIONES (DRY-RUN)"

  log "Verificando estado de migraciones..."

  # Mostrar estado actual
  docker exec ciber-backend-prod npx prisma migrate status || true

  log ""
  log "Obteniendo preview de cambios..."

  # Intentar obtener preview (puede no estar disponible en todas las versiones)
  docker exec ciber-backend-prod npx prisma migrate deploy --preview-only 2>&1 || {
    log_warning "Preview no disponible en esta versión de Prisma"
    log "Continuando con validación básica..."
  }

  # Verificar que hay archivo de schema
  if ! docker exec ciber-backend-prod test -f /app/prisma/schema.prisma; then
    log_error "Archivo schema.prisma no encontrado"
    exit 1
  fi

  log_success "Validación de migraciones completada"
}

# ==========================================
# 3. APLICAR MIGRACIONES
# ==========================================

apply_migrations() {
  log_section "3. APLICANDO MIGRACIONES"

  if [ "$PREVIEW_ONLY" = true ]; then
    log_warning "Modo preview - No se aplicarán migraciones"
    return 0
  fi

  log "Aplicando migraciones pendientes..."

  # Aplicar migraciones
  if docker exec ciber-backend-prod npx prisma migrate deploy 2>&1 | tee /tmp/migration.log; then
    log_success "Migraciones aplicadas exitosamente"
  else
    log_error "Fallo al aplicar migraciones"
    log "Logs de la migración:"
    cat /tmp/migration.log
    return 1
  fi

  # Regenerar Prisma Client
  log "Regenerando Prisma Client..."
  if docker exec ciber-backend-prod npx prisma generate; then
    log_success "Prisma Client regenerado"
  else
    log_warning "Fallo al regenerar Prisma Client (no crítico)"
  fi
}

# ==========================================
# 4. VALIDACIÓN POST-MIGRACIÓN
# ==========================================

validate_post_migration() {
  log_section "4. VALIDANDO INTEGRIDAD POST-MIGRACIÓN"

  # Obtener conteos post-migración
  local USERS_AFTER=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  local ENROLLMENTS_AFTER=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "0")
  local COURSES_AFTER=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM courses;" 2>/dev/null | tr -d ' ' || echo "0")

  log "Comparación de registros:"
  log "  - Usuarios: $USERS_BEFORE → $USERS_AFTER"
  log "  - Inscripciones: $ENROLLMENTS_BEFORE → $ENROLLMENTS_AFTER"
  log "  - Cursos: $COURSES_BEFORE → $COURSES_AFTER"

  # Validar que no se perdieron datos
  if [ "$USERS_AFTER" -lt "$USERS_BEFORE" ]; then
    log_error "❌ PÉRDIDA DE DATOS: Usuarios ($USERS_BEFORE → $USERS_AFTER)"
    return 1
  fi

  if [ "$ENROLLMENTS_AFTER" -lt "$ENROLLMENTS_BEFORE" ]; then
    log_error "❌ PÉRDIDA DE DATOS: Inscripciones ($ENROLLMENTS_BEFORE → $ENROLLMENTS_AFTER)"
    return 1
  fi

  if [ "$COURSES_AFTER" -lt "$COURSES_BEFORE" ]; then
    log_error "❌ PÉRDIDA DE DATOS: Cursos ($COURSES_BEFORE → $COURSES_AFTER)"
    return 1
  fi

  # Validar integridad referencial
  log "Verificando integridad referencial..."

  local ORPHAN_ENROLLMENTS=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT COUNT(*) FROM enrollments e WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = e.\"userId\");" \
    2>/dev/null | tr -d ' ' || echo "0")

  if [ "$ORPHAN_ENROLLMENTS" -gt 0 ]; then
    log_warning "Inscripciones huérfanas detectadas: $ORPHAN_ENROLLMENTS"
  else
    log_success "Integridad referencial OK"
  fi

  log_success "Validación completada - No se detectó pérdida de datos"
}

# ==========================================
# 5. ROLLBACK EN CASO DE FALLO
# ==========================================

rollback_migration() {
  log_section "❌ ROLLBACK DE MIGRACIÓN"

  if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    log_error "No hay backup disponible para restaurar"
    return 1
  fi

  log_warning "Restaurando base de datos desde backup..."
  log "Backup: $BACKUP_FILE"

  # Restaurar desde backup
  if gunzip -c "$BACKUP_FILE" | docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME 2>&1; then
    log_success "Base de datos restaurada desde backup"
  else
    log_error "Fallo al restaurar backup"
    log_error "ACCIÓN MANUAL REQUERIDA!"
    log "Para restaurar manualmente:"
    log "  gunzip -c $BACKUP_FILE | docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME"
    return 1
  fi

  # Validar que restauración fue exitosa
  local USERS_RESTORED=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")

  if [ "$USERS_RESTORED" -eq "$USERS_BEFORE" ]; then
    log_success "Restauración verificada: $USERS_RESTORED usuarios"
  else
    log_warning "Conteo de usuarios difiere: $USERS_BEFORE (esperado) vs $USERS_RESTORED (actual)"
  fi

  log_success "Rollback completado"
}

# ==========================================
# MAIN
# ==========================================

main() {
  log_section "🔧 SAFE MIGRATION SCRIPT"

  log "Modo: $([ "$PREVIEW_ONLY" = true ] && echo "PREVIEW ONLY" || echo "APLICAR MIGRACIONES")"

  # Validar variables de entorno
  if [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    log_error "Variables DB_USER o DB_NAME no configuradas"
    exit 1
  fi

  # Paso 1: Backup
  create_backup || exit 1

  # Paso 2: Preview
  preview_migrations || exit 1

  if [ "$PREVIEW_ONLY" = true ]; then
    log_section "✓ PREVIEW COMPLETADO"
    log "No se aplicaron cambios a la base de datos"
    exit 0
  fi

  # Paso 3: Aplicar migraciones
  if ! apply_migrations; then
    log_error "Migración falló - Iniciando rollback..."
    rollback_migration
    exit 1
  fi

  # Paso 4: Validar
  if ! validate_post_migration; then
    log_error "Validación post-migración falló - Iniciando rollback..."
    rollback_migration
    exit 1
  fi

  # Éxito!
  log_section "✅ MIGRACIÓN COMPLETADA EXITOSAMENTE"

  log_success "Backup guardado en: $BACKUP_FILE"
  log_success "Base de datos actualizada sin pérdida de datos"

  return 0
}

# Ejecutar main
main "$@"
