#!/bin/bash
#
# SSL Certificate Renewal Script
# ===============================
# Renueva certificados SSL de Let's Encrypt manualmente
#
# Uso:
#   ./scripts/renew-ssl.sh              # Renovar si es necesario
#   ./scripts/renew-ssl.sh --force      # Forzar renovación
#   ./scripts/renew-ssl.sh --dry-run    # Simulación sin cambios reales
#   ./scripts/renew-ssl.sh --check      # Solo verificar expiración
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
CERT_DIR="$PROJECT_ROOT/nginx/ssl/certbot/conf"

# Opciones
FORCE_RENEWAL=false
DRY_RUN=false
CHECK_ONLY=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --force)
      FORCE_RENEWAL=true
      ;;
    --dry-run)
      DRY_RUN=true
      ;;
    --check)
      CHECK_ONLY=true
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--force|--dry-run|--check]"
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
# 1. VERIFICAR CONFIGURACIÓN
# ==========================================

check_configuration() {
  log_section "1. VERIFICANDO CONFIGURACIÓN"

  # Verificar variables de entorno
  if [ -z "$DOMAIN" ]; then
    log_error "Variable DOMAIN no configurada"
    log "Configurar en .env: DOMAIN=plataforma-ciber.com"
    exit 1
  fi

  log "Dominio: $DOMAIN"

  # Verificar certbot
  if ! command -v certbot &> /dev/null; then
    log_warning "Certbot no instalado en host"
    log "Usando certbot desde Docker..."
    USE_DOCKER=true
  else
    log_success "Certbot disponible"
    USE_DOCKER=false
  fi

  # Verificar directorio de certificados
  if [ ! -d "$CERT_DIR/live/$DOMAIN" ]; then
    log_warning "Certificados no encontrados en: $CERT_DIR/live/$DOMAIN"
    log "Ejecutar primero: docker-compose -f docker-compose.certbot.yml run --rm certbot-init"
    exit 1
  fi

  log_success "Configuración verificada"
}

# ==========================================
# 2. VERIFICAR EXPIRACIÓN DE CERTIFICADO
# ==========================================

check_certificate_expiration() {
  log_section "2. VERIFICANDO EXPIRACIÓN"

  local CERT_FILE="$CERT_DIR/live/$DOMAIN/cert.pem"

  if [ ! -f "$CERT_FILE" ]; then
    log_error "Certificado no encontrado: $CERT_FILE"
    exit 1
  fi

  # Obtener fecha de expiración
  EXPIRY_DATE=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY_DATE" +%s)
  NOW_EPOCH=$(date +%s)

  DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

  log "Fecha de expiración: $EXPIRY_DATE"
  log "Días hasta expiración: $DAYS_UNTIL_EXPIRY"

  if [ $DAYS_UNTIL_EXPIRY -lt 0 ]; then
    log_error "❌ Certificado EXPIRADO hace $((-DAYS_UNTIL_EXPIRY)) días"
    RENEWAL_NEEDED=true
  elif [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    log_warning "⚠️  Certificado expira en $DAYS_UNTIL_EXPIRY días (renovación recomendada)"
    RENEWAL_NEEDED=true
  else
    log_success "✓ Certificado válido por $DAYS_UNTIL_EXPIRY días"
    RENEWAL_NEEDED=false
  fi

  if [ "$CHECK_ONLY" = true ]; then
    log "Solo verificación - Saliendo"
    exit 0
  fi

  if [ "$RENEWAL_NEEDED" = false ] && [ "$FORCE_RENEWAL" = false ]; then
    log "No es necesaria la renovación"
    log "Usar --force para renovar de todas formas"
    exit 0
  fi
}

# ==========================================
# 3. RENOVAR CERTIFICADO
# ==========================================

renew_certificate() {
  log_section "3. RENOVANDO CERTIFICADO"

  if [ "$DRY_RUN" = true ]; then
    log_warning "Modo DRY-RUN - Sin cambios reales"
    DRY_RUN_FLAG="--dry-run"
  else
    DRY_RUN_FLAG=""
  fi

  if [ "$FORCE_RENEWAL" = true ]; then
    FORCE_FLAG="--force-renewal"
  else
    FORCE_FLAG=""
  fi

  # Ejecutar renovación
  log "Renovando certificado para $DOMAIN..."

  if [ "$USE_DOCKER" = true ]; then
    # Usar certbot desde Docker
    docker-compose -f "$PROJECT_ROOT/docker-compose.certbot.yml" run --rm certbot-init \
      certbot renew \
      --webroot \
      --webroot-path=/var/www/certbot \
      $DRY_RUN_FLAG \
      $FORCE_FLAG
  else
    # Usar certbot local
    certbot renew \
      --webroot \
      --webroot-path="$PROJECT_ROOT/nginx/ssl/certbot/www" \
      $DRY_RUN_FLAG \
      $FORCE_FLAG
  fi

  if [ $? -eq 0 ]; then
    log_success "Renovación exitosa"
  else
    log_error "Renovación falló"
    exit 1
  fi
}

# ==========================================
# 4. RECARGAR NGINX
# ==========================================

reload_nginx() {
  log_section "4. RECARGANDO NGINX"

  if [ "$DRY_RUN" = true ]; then
    log "Modo DRY-RUN - No se recargará nginx"
    return 0
  fi

  log "Recargando configuración de nginx..."

  # Verificar que nginx está corriendo
  if docker ps | grep -q "ciber-nginx"; then
    # Test de configuración
    if docker exec ciber-nginx-prod nginx -t 2>&1; then
      log_success "Configuración de nginx válida"

      # Reload
      docker exec ciber-nginx-prod nginx -s reload

      if [ $? -eq 0 ]; then
        log_success "Nginx recargado exitosamente"
      else
        log_error "Fallo al recargar nginx"
        exit 1
      fi
    else
      log_error "Configuración de nginx inválida"
      exit 1
    fi
  else
    log_warning "Contenedor nginx no está corriendo"
    log "Ejecutar: docker-compose up -d nginx"
  fi
}

# ==========================================
# 5. VERIFICAR CERTIFICADO RENOVADO
# ==========================================

verify_renewed_certificate() {
  log_section "5. VERIFICANDO CERTIFICADO RENOVADO"

  if [ "$DRY_RUN" = true ]; then
    log "Modo DRY-RUN - Verificación omitida"
    return 0
  fi

  # Verificar nuevo certificado
  local CERT_FILE="$CERT_DIR/live/$DOMAIN/cert.pem"

  EXPIRY_DATE=$(openssl x509 -in "$CERT_FILE" -noout -enddate | cut -d= -f2)
  EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$EXPIRY_DATE" +%s)
  NOW_EPOCH=$(date +%s)
  DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

  log "Nueva fecha de expiración: $EXPIRY_DATE"
  log "Días de validez: $DAYS_UNTIL_EXPIRY"

  if [ $DAYS_UNTIL_EXPIRY -gt 80 ]; then
    log_success "✓ Certificado renovado correctamente"
  else
    log_warning "⚠️  Certificado no parece estar renovado"
  fi

  # Verificar HTTPS funcionando
  if command -v curl &> /dev/null; then
    log "Verificando HTTPS..."

    if curl -sSf -I "https://$DOMAIN" > /dev/null 2>&1; then
      log_success "✓ HTTPS funcionando correctamente"
    else
      log_warning "⚠️  No se pudo verificar HTTPS (puede ser normal si el dominio no apunta a este servidor)"
    fi
  fi
}

# ==========================================
# MAIN
# ==========================================

main() {
  log_section "🔒 SSL CERTIFICATE RENEWAL"

  # Paso 1: Verificar configuración
  check_configuration || exit 1

  # Paso 2: Verificar expiración
  check_certificate_expiration || exit 0

  # Paso 3: Renovar certificado
  renew_certificate || exit 1

  # Paso 4: Recargar nginx
  reload_nginx || exit 1

  # Paso 5: Verificar certificado renovado
  verify_renewed_certificate

  # Éxito!
  log_section "✅ RENOVACIÓN COMPLETADA"

  log_success "Certificado renovado exitosamente"
  log "Válido por $DAYS_UNTIL_EXPIRY días más"

  return 0
}

# Ejecutar main
main "$@"
