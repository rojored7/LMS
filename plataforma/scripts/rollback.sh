#!/bin/bash
#
# Rollback Script
# ===============
# Revierte deployment a estado anterior conocido
#
# Uso:
#   ./scripts/rollback.sh                # Interactivo
#   ./scripts/rollback.sh --auto         # Automático (para CI/CD)
#   ./scripts/rollback.sh --to=blue      # Rollback a entorno específico
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
STATE_DIR="$PROJECT_ROOT/.deployment-state"

AUTO_MODE=false
TARGET_ENV=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --auto)
      AUTO_MODE=true
      ;;
    --to=*)
      TARGET_ENV="${arg#*=}"
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
# 1. CARGAR ESTADO PREVIO
# ==========================================

load_previous_state() {
  log_section "1. CARGANDO ESTADO PREVIO"

  if [ ! -f "$STATE_DIR/pre-deployment-state.json" ]; then
    log_error "No se encontró estado previo"
    log "Archivo esperado: $STATE_DIR/pre-deployment-state.json"
    exit 1
  fi

  # Leer estado usando jq si está disponible
  if command -v jq &> /dev/null; then
    PREV_ENV=$(jq -r '.current_env' "$STATE_DIR/pre-deployment-state.json")
    BACKUP_FILE=$(jq -r '.backup_file' "$STATE_DIR/pre-deployment-state.json")
    PREV_USERS=$(jq -r '.users_count' "$STATE_DIR/pre-deployment-state.json")
    PREV_ENROLLMENTS=$(jq -r '.enrollments_count' "$STATE_DIR/pre-deployment-state.json")
    GIT_SHA=$(jq -r '.git_sha' "$STATE_DIR/pre-deployment-state.json")
  else
    log_warning "jq no disponible, leyendo manualmente..."
    PREV_ENV=$(grep '"current_env"' "$STATE_DIR/pre-deployment-state.json" | cut -d'"' -f4)
    BACKUP_FILE=$(grep '"backup_file"' "$STATE_DIR/pre-deployment-state.json" | cut -d'"' -f4)
  fi

  log_success "Estado cargado:"
  log "  - Entorno previo: $PREV_ENV"
  log "  - Backup: $BACKUP_FILE"
  log "  - Usuarios: ${PREV_USERS:-unknown}"
  log "  - Git SHA: ${GIT_SHA:-unknown}"

  # Usar target especificado o el previo
  if [ -n "$TARGET_ENV" ]; then
    ROLLBACK_TO=$TARGET_ENV
  else
    ROLLBACK_TO=$PREV_ENV
  fi

  log "Rollback hacia: $ROLLBACK_TO"

  export PREV_ENV BACKUP_FILE ROLLBACK_TO
}

# ==========================================
# 2. CONFIRMACIÓN (MODO INTERACTIVO)
# ==========================================

confirm_rollback() {
  if [ "$AUTO_MODE" = true ]; then
    log_warning "Modo automático - Rollback sin confirmación"
    return 0
  fi

  log_section "2. CONFIRMACIÓN DE ROLLBACK"

  log_warning "ADVERTENCIA: Esta operación:"
  log "  - Cambiará el tráfico a entorno: $ROLLBACK_TO"
  log "  - Detendrá el entorno actual"
  log "  - NO restaurará la base de datos automáticamente"
  echo ""
  log "¿Deseas continuar? (yes/no)"

  read -r CONFIRM

  if [ "$CONFIRM" != "yes" ]; then
    log "Rollback cancelado por el usuario"
    exit 0
  fi

  log_success "Confirmación recibida"
}

# ==========================================
# 3. DETECTAR ENTORNO ACTUAL
# ==========================================

detect_current_environment() {
  log_section "3. DETECTANDO ENTORNO ACTUAL"

  if docker ps --format '{{.Names}}' | grep -q "ciber-backend-blue"; then
    CURRENT_ENV="blue"
  elif docker ps --format '{{.Names}}' | grep -q "ciber-backend-green"; then
    CURRENT_ENV="green"
  else
    CURRENT_ENV="none"
  fi

  log "Entorno actualmente corriendo: $CURRENT_ENV"

  if [ "$CURRENT_ENV" = "$ROLLBACK_TO" ]; then
    log_warning "El entorno actual ya es $ROLLBACK_TO"
    log "No se necesita rollback"
    exit 0
  fi

  export CURRENT_ENV
}

# ==========================================
# 4. VALIDAR ENTORNO DE DESTINO
# ==========================================

validate_target_environment() {
  log_section "4. VALIDANDO ENTORNO DE DESTINO"

  if [ "$ROLLBACK_TO" = "none" ]; then
    log_error "No se puede hacer rollback a 'none'"
    exit 1
  fi

  # Verificar si el entorno de destino existe
  if ! docker-compose -f "docker-compose.${ROLLBACK_TO}.yml" ps &> /dev/null; then
    log_warning "Entorno $ROLLBACK_TO no está corriendo"
    log "¿Deseas levantar el entorno $ROLLBACK_TO? (yes/no)"

    if [ "$AUTO_MODE" = true ]; then
      log "Modo automático - Levantando entorno $ROLLBACK_TO..."
      START_ENV=true
    else
      read -r START_CONFIRM
      if [ "$START_CONFIRM" = "yes" ]; then
        START_ENV=true
      else
        log "Rollback cancelado"
        exit 0
      fi
    fi

    if [ "$START_ENV" = true ]; then
      log "Levantando entorno $ROLLBACK_TO..."
      docker-compose -f "docker-compose.${ROLLBACK_TO}.yml" up -d

      # Esperar a que esté listo
      log "Esperando a que servicios estén listos..."
      sleep 10

      local PORT=$((ROLLBACK_TO == "blue" ? 4000 : 4001))

      for i in {1..30}; do
        if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
          log_success "Entorno $ROLLBACK_TO está listo"
          break
        fi
        if [ $i -eq 30 ]; then
          log_error "Entorno $ROLLBACK_TO no responde"
          exit 1
        fi
        sleep 2
      done
    fi
  else
    log_success "Entorno $ROLLBACK_TO está corriendo"
  fi
}

# ==========================================
# 5. CAMBIAR TRÁFICO DE NGINX
# ==========================================

switch_traffic() {
  log_section "5. CAMBIANDO TRÁFICO A $ROLLBACK_TO"

  local BACKEND_PORT=$((ROLLBACK_TO == "blue" ? 4000 : 4001))
  local FRONTEND_PORT=$((ROLLBACK_TO == "blue" ? 3000 : 3001))

  # Generar configuración de upstream
  log "Generando configuración de nginx..."

  cat > "$PROJECT_ROOT/nginx/upstream.conf" <<EOF
# Generated by rollback.sh
# Environment: $ROLLBACK_TO
# Timestamp: $(date -Iseconds)
# Reason: Rollback from $CURRENT_ENV

upstream backend {
    server backend-${ROLLBACK_TO}:4000 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server frontend-${ROLLBACK_TO}:80 max_fails=3 fail_timeout=30s;
}

upstream executor {
    server executor-${ROLLBACK_TO}:5000 max_fails=3 fail_timeout=30s;
}
EOF

  log_success "Configuración generada"

  # Test configuración
  log "Validando configuración de nginx..."
  if docker exec ciber-nginx-prod nginx -t; then
    log_success "Configuración válida"
  else
    log_error "Configuración inválida"
    exit 1
  fi

  # Recargar nginx
  log "Recargando nginx..."
  if docker exec ciber-nginx-prod nginx -s reload; then
    log_success "Nginx recargado"
  else
    log_error "Fallo al recargar nginx"
    exit 1
  fi

  log_success "Tráfico ahora apunta a $ROLLBACK_TO"
}

# ==========================================
# 6. HEALTH CHECK DEL ENTORNO
# ==========================================

health_check() {
  log_section "6. VERIFICANDO SALUD DEL ENTORNO"

  local PORT=$((ROLLBACK_TO == "blue" ? 4000 : 4001))
  local URL="http://localhost:$PORT"

  # Check básico
  if curl -sf "$URL/health" > /dev/null; then
    log_success "Health check básico: OK"
  else
    log_error "Health check falló"
    exit 1
  fi

  # Check de DB y Redis
  if curl -sf "$URL/health/ready" > /dev/null; then
    log_success "Conexiones a DB y Redis: OK"
  else
    log_warning "Problemas con DB o Redis"
  fi

  log_success "Entorno $ROLLBACK_TO está saludable"
}

# ==========================================
# 7. DETENER ENTORNO ANTERIOR
# ==========================================

stop_old_environment() {
  log_section "7. DETENIENDO ENTORNO ANTERIOR"

  if [ "$CURRENT_ENV" = "none" ]; then
    log "No hay entorno anterior que detener"
    return 0
  fi

  log "¿Deseas detener el entorno $CURRENT_ENV? (yes/no)"

  if [ "$AUTO_MODE" = true ]; then
    log "Modo automático - Deteniendo $CURRENT_ENV..."
    STOP_CONFIRM="yes"
  else
    read -r STOP_CONFIRM
  fi

  if [ "$STOP_CONFIRM" = "yes" ]; then
    log "Deteniendo $CURRENT_ENV..."
    docker-compose -f "docker-compose.${CURRENT_ENV}.yml" down
    log_success "Entorno $CURRENT_ENV detenido"
  else
    log "Entorno $CURRENT_ENV sigue corriendo"
  fi
}

# ==========================================
# 8. OPCIÓN DE RESTAURAR DB
# ==========================================

offer_database_restore() {
  log_section "8. RESTAURACIÓN DE BASE DE DATOS"

  if [ ! -f "$BACKUP_FILE" ]; then
    log_warning "No hay backup disponible"
    return 0
  fi

  log_warning "Backup disponible: $BACKUP_FILE"
  log "¿Deseas restaurar la base de datos desde este backup? (yes/no)"
  log_warning "ADVERTENCIA: Esto sobrescribirá todos los datos actuales"

  if [ "$AUTO_MODE" = true ]; then
    log "Modo automático - NO restaurando DB (requiere confirmación manual)"
    log "Para restaurar manualmente:"
    log "  gunzip -c $BACKUP_FILE | docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME"
    return 0
  fi

  read -r RESTORE_CONFIRM

  if [ "$RESTORE_CONFIRM" = "yes" ]; then
    log "Restaurando base de datos..."

    if gunzip -c "$BACKUP_FILE" | docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME 2>&1; then
      log_success "Base de datos restaurada"

      # Validar
      local USERS_RESTORED=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
      log "Usuarios después de restauración: $USERS_RESTORED"

      if [ -n "$PREV_USERS" ] && [ "$USERS_RESTORED" -eq "$PREV_USERS" ]; then
        log_success "Conteo de usuarios coincide: $PREV_USERS"
      fi
    else
      log_error "Fallo al restaurar base de datos"
    fi
  else
    log "Base de datos no restaurada"
    log "La base de datos mantiene el estado actual"
  fi
}

# ==========================================
# 9. GUARDAR ESTADO DE ROLLBACK
# ==========================================

save_rollback_state() {
  log_section "9. GUARDANDO ESTADO DE ROLLBACK"

  cat > "$STATE_DIR/rollback-state.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "rollback_from": "$CURRENT_ENV",
  "rollback_to": "$ROLLBACK_TO",
  "reason": "manual_rollback",
  "backup_used": "$BACKUP_FILE",
  "performed_by": "${USER:-unknown}"
}
EOF

  log_success "Estado de rollback guardado"
}

# ==========================================
# MAIN
# ==========================================

main() {
  log_section "🔄 ROLLBACK SCRIPT"

  # Paso 1: Cargar estado previo
  load_previous_state || exit 1

  # Paso 2: Confirmación
  confirm_rollback || exit 1

  # Paso 3: Detectar entorno actual
  detect_current_environment || exit 1

  # Paso 4: Validar entorno de destino
  validate_target_environment || exit 1

  # Paso 5: Cambiar tráfico
  switch_traffic || exit 1

  # Paso 6: Health check
  health_check || exit 1

  # Paso 7: Detener entorno anterior
  stop_old_environment

  # Paso 8: Ofrecer restaurar DB
  offer_database_restore

  # Paso 9: Guardar estado
  save_rollback_state

  # Éxito!
  log_section "✅ ROLLBACK COMPLETADO"

  log_success "Sistema revertido a entorno: $ROLLBACK_TO"
  log_success "Tráfico funcionando correctamente"

  if [ -n "$PREV_USERS" ]; then
    local CURRENT_USERS=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    log "Usuarios: $CURRENT_USERS"
  fi

  return 0
}

# Ejecutar main
main "$@"
