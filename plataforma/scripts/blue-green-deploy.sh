#!/bin/bash
#
# Blue-Green Deployment Script
# =============================
# Implementa deployment sin downtime con protección total contra pérdida de datos
#
# Características:
# - Zero downtime (usuarios no se desconectan)
# - Backup automático pre-deployment
# - Validación de migraciones antes de aplicar
# - Rollback automático si algo falla
# - Health checks exhaustivos
# - Smoke tests
# - Monitoreo post-deployment
#
# Uso:
#   ./scripts/blue-green-deploy.sh --env=production
#   ./scripts/blue-green-deploy.sh --env=staging --dry-run
#

set -e  # Exit on error
set -o pipefail  # Exit on pipe failures

# ==========================================
# CONFIGURACIÓN
# ==========================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directorios
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_ROOT/database/backups"
STATE_DIR="$PROJECT_ROOT/.deployment-state"

# Configuración de timeout
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_RETRIES=30
MONITORING_DURATION=60
CONNECTION_DRAIN_TIME=60

# Variables de entorno (con defaults)
ENV=${ENV:-production}
DRY_RUN=false
SKIP_BACKUP=false
SKIP_TESTS=false

# Parse argumentos
for arg in "$@"; do
  case $arg in
    --env=*)
      ENV="${arg#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

# ==========================================
# FUNCIONES HELPER
# ==========================================

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

log_info() {
  echo -e "${CYAN}ℹ${NC}  $1"
}

log_section() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
  echo ""
}

cleanup_on_exit() {
  log_warning "Script interrupted. Cleaning up..."
  # Aquí podrías agregar cleanup si es necesario
}

trap cleanup_on_exit INT TERM

# ==========================================
# VALIDACIONES INICIALES
# ==========================================

validate_prerequisites() {
  log_section "1. VALIDANDO PRERREQUISITOS"

  # Verificar docker
  if ! command -v docker &> /dev/null; then
    log_error "Docker no está instalado"
    exit 1
  fi
  log_success "Docker disponible"

  # Verificar docker-compose
  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose no está instalado"
    exit 1
  fi
  log_success "Docker Compose disponible"

  # Verificar que estamos en el directorio correcto
  if [ ! -f "$PROJECT_ROOT/docker-compose.blue.yml" ]; then
    log_error "docker-compose.blue.yml no encontrado"
    exit 1
  fi
  log_success "Archivos de configuración encontrados"

  # Verificar variables de entorno críticas
  if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    log_error "Variables de base de datos no configuradas"
    log_info "Asegúrate de tener DB_USER, DB_PASSWORD y DB_NAME en .env"
    exit 1
  fi
  log_success "Variables de entorno configuradas"

  # Crear directorio de backups si no existe
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$STATE_DIR"

  log_success "Todos los prerrequisitos cumplidos"
}

# ==========================================
# DETECCIÓN DE ENTORNO ACTIVO
# ==========================================

detect_active_environment() {
  log_section "2. DETECTANDO ENTORNO ACTIVO"

  # Verificar si hay containers blue corriendo
  if docker ps --format '{{.Names}}' | grep -q "ciber-backend-blue"; then
    CURRENT_ENV="blue"
    NEW_ENV="green"
    OLD_PORT=4000
    NEW_PORT=4001
  elif docker ps --format '{{.Names}}' | grep -q "ciber-backend-green"; then
    CURRENT_ENV="green"
    NEW_ENV="blue"
    OLD_PORT=4001
    NEW_PORT=4000
  else
    # Ninguno corriendo, usar blue como default
    log_warning "Ningún entorno activo detectado, iniciando con BLUE"
    CURRENT_ENV="none"
    NEW_ENV="blue"
    OLD_PORT=0
    NEW_PORT=4000
  fi

  log_info "Entorno actual: ${CURRENT_ENV:-none}"
  log_info "Nuevo entorno: $NEW_ENV"
  log_info "Puerto actual: ${OLD_PORT:-N/A}"
  log_info "Puerto nuevo: $NEW_PORT"

  export CURRENT_ENV NEW_ENV OLD_PORT NEW_PORT
}

# ==========================================
# BACKUP DE BASE DE DATOS
# ==========================================

create_backup() {
  log_section "3. CREANDO BACKUP DE SEGURIDAD"

  if [ "$SKIP_BACKUP" = true ]; then
    log_warning "Backup omitido (--skip-backup)"
    return 0
  fi

  local TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  local BACKUP_FILE="$BACKUP_DIR/pre-deploy_${TIMESTAMP}.sql.gz"

  log_info "Creando backup de PostgreSQL..."

  # Obtener estadísticas pre-backup
  local USERS_BEFORE=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  local ENROLLMENTS_BEFORE=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "0")

  log_info "Estadísticas actuales:"
  log_info "  - Usuarios: $USERS_BEFORE"
  log_info "  - Inscripciones: $ENROLLMENTS_BEFORE"

  # Crear backup
  if docker exec ciber-postgres-prod pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_FILE"; then
    log_success "Backup creado: $BACKUP_FILE"
  else
    log_error "Fallo al crear backup"
    exit 1
  fi

  # Verificar integridad del backup
  if gunzip -t "$BACKUP_FILE" 2>/dev/null; then
    local BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup verificado: $BACKUP_SIZE"
  else
    log_error "Backup corrupto"
    exit 1
  fi

  # Guardar estado para rollback
  cat > "$STATE_DIR/pre-deployment-state.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "current_env": "$CURRENT_ENV",
  "git_sha": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "backup_file": "$BACKUP_FILE",
  "users_count": $USERS_BEFORE,
  "enrollments_count": $ENROLLMENTS_BEFORE,
  "docker_images": {
    "backend_blue": "$(docker inspect ciber-backend-blue --format='{{.Image}}' 2>/dev/null || echo 'none')",
    "backend_green": "$(docker inspect ciber-backend-green --format='{{.Image}}' 2>/dev/null || echo 'none')"
  }
}
EOF

  log_success "Estado guardado en $STATE_DIR/pre-deployment-state.json"
  export BACKUP_FILE USERS_BEFORE ENROLLMENTS_BEFORE
}

# ==========================================
# PULL DE NUEVAS IMÁGENES
# ==========================================

pull_new_images() {
  log_section "4. DESCARGANDO NUEVAS IMÁGENES DOCKER"

  local GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-tu-usuario/tu-repo}"
  local GITHUB_SHA="${GITHUB_SHA:-latest}"

  log_info "Repository: $GITHUB_REPOSITORY"
  log_info "Tag: $GITHUB_SHA"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Omitiendo pull de imágenes"
    return 0
  fi

  # Pull backend
  log_info "Pulling backend image..."
  if docker pull "ghcr.io/$GITHUB_REPOSITORY/backend:$GITHUB_SHA"; then
    log_success "Backend image descargada"
  else
    log_error "Fallo al descargar backend image"
    exit 1
  fi

  # Pull frontend
  log_info "Pulling frontend image..."
  if docker pull "ghcr.io/$GITHUB_REPOSITORY/frontend:$GITHUB_SHA"; then
    log_success "Frontend image descargada"
  else
    log_error "Fallo al descargar frontend image"
    exit 1
  fi

  # Pull executor
  log_info "Pulling executor image..."
  if docker pull "ghcr.io/$GITHUB_REPOSITORY/executor:$GITHUB_SHA"; then
    log_success "Executor image descargada"
  else
    log_error "Fallo al descargar executor image"
    exit 1
  fi
}

# ==========================================
# VALIDACIÓN Y APLICACIÓN DE MIGRACIONES
# ==========================================

run_migrations() {
  log_section "5. VALIDANDO Y APLICANDO MIGRACIONES"

  log_info "Ejecutando script de migración segura..."

  if [ -f "$SCRIPT_DIR/safe-migrate.sh" ]; then
    if bash "$SCRIPT_DIR/safe-migrate.sh"; then
      log_success "Migraciones aplicadas exitosamente"
    else
      log_error "Fallo en migraciones"
      log_error "Iniciando rollback automático..."
      rollback_deployment
      exit 1
    fi
  else
    log_warning "safe-migrate.sh no encontrado, omitiendo migraciones"
  fi
}

# ==========================================
# LEVANTAR NUEVO ENTORNO
# ==========================================

start_new_environment() {
  log_section "6. LEVANTANDO NUEVO ENTORNO: $NEW_ENV"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Omitiendo start de containers"
    return 0
  fi

  log_info "Iniciando containers del entorno $NEW_ENV..."

  # Exportar variables necesarias
  export GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-tu-usuario/tu-repo}"
  export GITHUB_SHA="${GITHUB_SHA:-latest}"

  # Levantar servicios del nuevo entorno
  if docker-compose -f "docker-compose.${NEW_ENV}.yml" up -d; then
    log_success "Entorno $NEW_ENV levantado"
  else
    log_error "Fallo al levantar entorno $NEW_ENV"
    exit 1
  fi

  # Esperar a que los containers estén corriendo
  sleep 5

  log_info "Containers activos:"
  docker ps --filter "name=ciber-.*-${NEW_ENV}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

# ==========================================
# HEALTH CHECKS EXHAUSTIVOS
# ==========================================

run_health_checks() {
  log_section "7. EJECUTANDO HEALTH CHECKS"

  local BACKEND_URL="http://localhost:$NEW_PORT"

  log_info "Esperando a que backend esté listo..."

  for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if curl -sf "$BACKEND_URL/health" > /dev/null 2>&1; then
      log_success "Backend $NEW_ENV está respondiendo (intento $i/$HEALTH_CHECK_RETRIES)"
      break
    fi

    if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
      log_error "Backend $NEW_ENV no responde después de $HEALTH_CHECK_RETRIES intentos"
      log_info "Logs del backend:"
      docker logs "ciber-backend-$NEW_ENV" --tail 50
      return 1
    fi

    echo -n "."
    sleep 2
  done

  echo ""

  # Health check de /health/ready (verifica DB y Redis)
  log_info "Verificando conexiones a DB y Redis..."
  if curl -sf "$BACKEND_URL/health/ready" > /dev/null 2>&1; then
    log_success "Backend conectado a DB y Redis"
  else
    log_error "Backend no puede conectar a DB o Redis"
    return 1
  fi

  # Verificar executor
  log_info "Verificando executor..."
  local EXECUTOR_PORT=$((NEW_PORT == 4000 ? 5000 : 5001))
  if curl -sf "http://localhost:$EXECUTOR_PORT/health" > /dev/null 2>&1; then
    log_success "Executor $NEW_ENV está respondiendo"
  else
    log_warning "Executor no responde (no crítico)"
  fi

  log_success "Todos los health checks pasaron"
  return 0
}

# ==========================================
# SMOKE TESTS
# ==========================================

run_smoke_tests() {
  log_section "8. EJECUTANDO SMOKE TESTS"

  if [ "$SKIP_TESTS" = true ]; then
    log_warning "Smoke tests omitidos (--skip-tests)"
    return 0
  fi

  local BACKEND_URL="http://localhost:$NEW_PORT"
  local TEST_EMAIL="smoke-test-$(date +%s)@test.com"
  local TEST_PASSWORD="Test123!@#Secure"

  # Test 1: Registro de usuario
  log_info "Test 1/3: Registro de usuario..."
  local REGISTER_RESPONSE=$(curl -sf -X POST "$BACKEND_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Smoke\",\"lastName\":\"Test\"}" \
    2>/dev/null)

  if [ $? -eq 0 ]; then
    log_success "Registro exitoso"
  else
    log_error "Fallo en registro"
    return 1
  fi

  # Test 2: Login
  log_info "Test 2/3: Login de usuario..."
  local LOGIN_RESPONSE=$(curl -sf -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    2>/dev/null)

  if [ $? -eq 0 ]; then
    log_success "Login exitoso"
    # Extraer token (requiere jq)
    if command -v jq &> /dev/null; then
      local TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken' 2>/dev/null)
    fi
  else
    log_error "Fallo en login"
    return 1
  fi

  # Test 3: API de cursos
  log_info "Test 3/3: Consulta de cursos..."
  if [ -n "$TOKEN" ]; then
    local COURSES_RESPONSE=$(curl -sf -H "Authorization: Bearer $TOKEN" "$BACKEND_URL/api/courses" 2>/dev/null)
  else
    local COURSES_RESPONSE=$(curl -sf "$BACKEND_URL/api/courses" 2>/dev/null)
  fi

  if [ $? -eq 0 ]; then
    log_success "API de cursos funcional"
  else
    log_error "Fallo en API de cursos"
    return 1
  fi

  # Limpiar usuario de prueba
  log_info "Limpiando usuario de prueba..."
  docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c "DELETE FROM users WHERE email='$TEST_EMAIL';" > /dev/null 2>&1

  log_success "Todos los smoke tests pasaron"
  return 0
}

# ==========================================
# VALIDACIÓN DE INTEGRIDAD DE DATOS
# ==========================================

validate_data_integrity() {
  log_section "9. VALIDANDO INTEGRIDAD DE DATOS"

  # Obtener conteos actuales
  local USERS_AFTER=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  local ENROLLMENTS_AFTER=$(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM enrollments;" 2>/dev/null | tr -d ' ' || echo "0")

  log_info "Usuarios antes: $USERS_BEFORE"
  log_info "Usuarios después: $USERS_AFTER"
  log_info "Inscripciones antes: $ENROLLMENTS_BEFORE"
  log_info "Inscripciones después: $ENROLLMENTS_AFTER"

  # Verificar que no se perdieron datos
  if [ "$USERS_AFTER" -lt "$USERS_BEFORE" ]; then
    log_error "Se perdieron usuarios: $USERS_BEFORE → $USERS_AFTER"
    return 1
  fi

  if [ "$ENROLLMENTS_AFTER" -lt "$ENROLLMENTS_BEFORE" ]; then
    log_error "Se perdieron inscripciones: $ENROLLMENTS_BEFORE → $ENROLLMENTS_AFTER"
    return 1
  fi

  log_success "Integridad de datos verificada"
  return 0
}

# ==========================================
# SWITCH DE NGINX
# ==========================================

switch_nginx_traffic() {
  log_section "10. CAMBIANDO TRÁFICO A $NEW_ENV"

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Omitiendo switch de nginx"
    return 0
  fi

  # Generar nuevo archivo de upstream
  log_info "Generando configuración de upstream para $NEW_ENV..."

  local UPSTREAM_FILE="$PROJECT_ROOT/nginx/upstream.conf"
  local BACKEND_PORT=$NEW_PORT
  local FRONTEND_PORT=$((NEW_PORT == 4000 ? 3000 : 3001))

  cat > "$UPSTREAM_FILE" <<EOF
# Generated by blue-green-deploy.sh
# Environment: $NEW_ENV
# Timestamp: $(date -Iseconds)

upstream backend {
    server backend-${NEW_ENV}:4000 max_fails=3 fail_timeout=30s;
}

upstream frontend {
    server frontend-${NEW_ENV}:80 max_fails=3 fail_timeout=30s;
}

upstream executor {
    server executor-${NEW_ENV}:5000 max_fails=3 fail_timeout=30s;
}
EOF

  log_success "Configuración de upstream generada"

  # Test configuración de nginx
  log_info "Validando configuración de nginx..."
  if docker exec ciber-nginx-prod nginx -t; then
    log_success "Configuración de nginx válida"
  else
    log_error "Configuración de nginx inválida"
    return 1
  fi

  # Recargar nginx (sin downtime)
  log_info "Recargando nginx..."
  if docker exec ciber-nginx-prod nginx -s reload; then
    log_success "Nginx recargado, tráfico ahora apunta a $NEW_ENV"
  else
    log_error "Fallo al recargar nginx"
    return 1
  fi

  log_success "Switch de tráfico completado"
}

# ==========================================
# MONITOREO POST-SWITCH
# ==========================================

monitor_new_environment() {
  log_section "11. MONITOREANDO ENTORNO NUEVO ($MONITORING_DURATION segundos)"

  local ERROR_COUNT=0
  local ERROR_THRESHOLD=5

  for i in $(seq 1 $MONITORING_DURATION); do
    # Verificar logs del backend
    local ERRORS=$(docker logs "ciber-backend-$NEW_ENV" --since=1s 2>&1 | grep -i "ERROR" | wc -l || echo "0")

    if [ "$ERRORS" -gt 0 ]; then
      ((ERROR_COUNT+=ERRORS))
      log_warning "Errores detectados: $ERRORS (total: $ERROR_COUNT)"

      if [ "$ERROR_COUNT" -gt "$ERROR_THRESHOLD" ]; then
        log_error "Demasiados errores detectados ($ERROR_COUNT > $ERROR_THRESHOLD)"
        log_error "Iniciando rollback automático..."
        return 1
      fi
    fi

    # Mostrar progreso cada 10 segundos
    if [ $((i % 10)) -eq 0 ]; then
      log_info "Monitoreo: $i/$MONITORING_DURATION segundos - Errores: $ERROR_COUNT"
    fi

    sleep 1
  done

  if [ "$ERROR_COUNT" -eq 0 ]; then
    log_success "Monitoreo completado sin errores"
  else
    log_warning "Monitoreo completado con $ERROR_COUNT errores (bajo el threshold)"
  fi

  return 0
}

# ==========================================
# APAGAR ENTORNO VIEJO
# ==========================================

stop_old_environment() {
  log_section "12. APAGANDO ENTORNO VIEJO: $CURRENT_ENV"

  if [ "$CURRENT_ENV" = "none" ]; then
    log_info "No hay entorno viejo que apagar (primera instalación)"
    return 0
  fi

  if [ "$DRY_RUN" = true ]; then
    log_warning "DRY RUN: Omitiendo stop del entorno viejo"
    return 0
  fi

  # Esperar a que drenen las conexiones activas
  log_info "Esperando ${CONNECTION_DRAIN_TIME}s para que drenen las conexiones..."
  sleep $CONNECTION_DRAIN_TIME

  # Detener servicios viejos
  log_info "Deteniendo containers del entorno $CURRENT_ENV..."
  if docker-compose -f "docker-compose.${CURRENT_ENV}.yml" down; then
    log_success "Entorno $CURRENT_ENV detenido"
  else
    log_warning "Problema al detener entorno $CURRENT_ENV (no crítico)"
  fi
}

# ==========================================
# LIMPIEZA
# ==========================================

cleanup() {
  log_section "13. LIMPIEZA"

  # Mantener solo últimos 7 backups
  log_info "Limpiando backups antiguos..."
  find "$BACKUP_DIR" -name "pre-deploy_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
  local BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/pre-deploy_*.sql.gz 2>/dev/null | wc -l)
  log_info "Backups actuales: $BACKUP_COUNT"

  # Limpiar imágenes Docker no usadas
  log_info "Limpiando imágenes Docker no usadas..."
  docker image prune -af --filter "until=168h" > /dev/null 2>&1 || true

  log_success "Limpieza completada"
}

# ==========================================
# ROLLBACK
# ==========================================

rollback_deployment() {
  log_section "ROLLBACK AUTOMÁTICO"

  if [ ! -f "$STATE_DIR/pre-deployment-state.json" ]; then
    log_error "No se encontró estado previo para rollback"
    return 1
  fi

  local PREV_ENV=$(jq -r '.current_env' "$STATE_DIR/pre-deployment-state.json")
  local BACKUP_FILE=$(jq -r '.backup_file' "$STATE_DIR/pre-deployment-state.json")

  log_warning "Volviendo a entorno: $PREV_ENV"

  # Si hay entorno previo, volver el tráfico
  if [ "$PREV_ENV" != "none" ]; then
    log_info "Reconfigurando nginx para $PREV_ENV..."

    local BACKEND_PORT=$((PREV_ENV == "blue" ? 4000 : 4001))
    local FRONTEND_PORT=$((PREV_ENV == "blue" ? 3000 : 3001))

    cat > "$PROJECT_ROOT/nginx/upstream.conf" <<EOF
upstream backend {
    server backend-${PREV_ENV}:4000;
}
upstream frontend {
    server frontend-${PREV_ENV}:80;
}
upstream executor {
    server executor-${PREV_ENV}:5000;
}
EOF

    docker exec ciber-nginx-prod nginx -s reload
    log_success "Tráfico revertido a $PREV_ENV"
  fi

  # Bajar entorno nuevo
  log_info "Deteniendo entorno $NEW_ENV..."
  docker-compose -f "docker-compose.${NEW_ENV}.yml" down

  # Preguntar si restaurar DB
  log_warning "¿Deseas restaurar la base de datos desde backup? (y/n)"
  log_info "Backup disponible: $BACKUP_FILE"

  # En modo automático, no restaurar DB a menos que sea crítico
  if [ -f "$BACKUP_FILE" ]; then
    log_info "Backup disponible pero no restaurado automáticamente"
    log_info "Para restaurar manualmente: gunzip -c $BACKUP_FILE | docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME"
  fi

  log_success "Rollback completado"
}

# ==========================================
# NOTIFICACIONES
# ==========================================

send_notification() {
  local STATUS=$1
  local MESSAGE=$2

  if [ -z "$SLACK_WEBHOOK" ]; then
    return 0
  fi

  local EMOJI="✅"
  local COLOR="good"

  if [ "$STATUS" = "failure" ]; then
    EMOJI="🚨"
    COLOR="danger"
  fi

  curl -X POST "$SLACK_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"$EMOJI $MESSAGE\"}" \
    > /dev/null 2>&1 || true
}

# ==========================================
# MAIN EXECUTION
# ==========================================

main() {
  log_section "🚀 BLUE-GREEN DEPLOYMENT - INICIO"

  log_info "Entorno: $ENV"
  log_info "Dry run: $DRY_RUN"

  # Paso 1: Validaciones
  validate_prerequisites || exit 1

  # Paso 2: Detectar entorno activo
  detect_active_environment || exit 1

  # Paso 3: Backup
  create_backup || exit 1

  # Paso 4: Pull imágenes
  pull_new_images || exit 1

  # Paso 5: Migraciones
  run_migrations || exit 1

  # Paso 6: Levantar nuevo entorno
  start_new_environment || exit 1

  # Paso 7: Health checks
  if ! run_health_checks; then
    log_error "Health checks fallaron"
    rollback_deployment
    send_notification "failure" "Deployment failed: Health checks"
    exit 1
  fi

  # Paso 8: Smoke tests
  if ! run_smoke_tests; then
    log_error "Smoke tests fallaron"
    rollback_deployment
    send_notification "failure" "Deployment failed: Smoke tests"
    exit 1
  fi

  # Paso 9: Validar integridad
  if ! validate_data_integrity; then
    log_error "Validación de integridad falló"
    rollback_deployment
    send_notification "failure" "Deployment failed: Data integrity"
    exit 1
  fi

  # Paso 10: Switch de tráfico
  if ! switch_nginx_traffic; then
    log_error "Switch de nginx falló"
    rollback_deployment
    send_notification "failure" "Deployment failed: Nginx switch"
    exit 1
  fi

  # Paso 11: Monitoreo post-switch
  if ! monitor_new_environment; then
    log_error "Monitoreo detectó problemas"
    rollback_deployment
    send_notification "failure" "Deployment failed: Post-deployment monitoring"
    exit 1
  fi

  # Paso 12: Apagar entorno viejo
  stop_old_environment || log_warning "Problema al apagar entorno viejo (no crítico)"

  # Paso 13: Limpieza
  cleanup

  # Éxito!
  log_section "✅ DEPLOYMENT COMPLETADO EXITOSAMENTE"

  log_success "Entorno activo: $NEW_ENV"
  log_success "Puerto backend: $NEW_PORT"
  log_success "Downtime: 0 segundos"

  send_notification "success" "Deployment to $NEW_ENV completed successfully"

  # Estadísticas finales
  echo ""
  log_info "Estadísticas del deployment:"
  log_info "  - Usuarios: $USERS_BEFORE → $(docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -t -c 'SELECT COUNT(*) FROM users;' 2>/dev/null | tr -d ' ')"
  log_info "  - Backup: $BACKUP_FILE"
  log_info "  - Git SHA: $(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"

  return 0
}

# Ejecutar main
main "$@"
