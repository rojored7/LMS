#!/bin/bash
#
# Script para generar secretos criptográficamente seguros
# Uso: ./scripts/generate-secrets.sh
#
# Genera secretos para:
# - JWT_SECRET (64 caracteres)
# - JWT_REFRESH_SECRET (64 caracteres)
# - DB_PASSWORD (32 caracteres)
# - REDIS_PASSWORD (32 caracteres)
#

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Generador de Secretos Seguros${NC}"
echo -e "${BLUE}   Plataforma Multi-Curso Ciberseguridad${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# Función para generar string aleatorio seguro
generate_secret() {
    local length=$1
    # Usa /dev/urandom para generar bytes aleatorios seguros
    # Convierte a base64 y limpia caracteres especiales
    openssl rand -base64 $((length * 3 / 4)) | tr -d '/+=' | head -c $length
}

# Función para validar longitud
validate_length() {
    local secret=$1
    local min_length=$2
    local length=${#secret}

    if [ $length -lt $min_length ]; then
        echo -e "${RED}✗ Error: Secreto generado es muy corto ($length < $min_length)${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ Longitud válida: $length caracteres${NC}"
    return 0
}

# Verificar dependencias
echo -e "${YELLOW}Verificando dependencias...${NC}"

if ! command -v openssl &> /dev/null; then
    echo -e "${RED}✗ Error: openssl no está instalado${NC}"
    echo "Instalar: apt-get install openssl (Ubuntu/Debian) o brew install openssl (macOS)"
    exit 1
fi

echo -e "${GREEN}✓ openssl disponible${NC}"
echo ""

# Generar secretos
echo -e "${BLUE}Generando secretos...${NC}"
echo ""

echo -e "${YELLOW}1. JWT_SECRET (64 caracteres)${NC}"
JWT_SECRET=$(generate_secret 64)
validate_length "$JWT_SECRET" 32 || exit 1
echo ""

echo -e "${YELLOW}2. JWT_REFRESH_SECRET (64 caracteres)${NC}"
JWT_REFRESH_SECRET=$(generate_secret 64)
validate_length "$JWT_REFRESH_SECRET" 32 || exit 1
echo ""

echo -e "${YELLOW}3. DB_PASSWORD (32 caracteres)${NC}"
DB_PASSWORD=$(generate_secret 32)
validate_length "$DB_PASSWORD" 16 || exit 1
echo ""

echo -e "${YELLOW}4. REDIS_PASSWORD (32 caracteres)${NC}"
REDIS_PASSWORD=$(generate_secret 32)
validate_length "$REDIS_PASSWORD" 16 || exit 1
echo ""

# Generar archivo de secretos
SECRETS_FILE="generated-secrets-$(date +%Y%m%d_%H%M%S).txt"

cat > "$SECRETS_FILE" <<EOF
═══════════════════════════════════════════════════
   SECRETOS GENERADOS - $(date -Iseconds)
═══════════════════════════════════════════════════

⚠️  IMPORTANTE: Estos secretos son sensibles y NUNCA deben committearse a git.

Para Desarrollo Local (.env):
────────────────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
────────────────────────────────────────────────────

Para GitHub Secrets:
────────────────────────────────────────────────────
1. Ve a: GitHub → Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Agrega cada uno de estos secretos:

   Name: JWT_SECRET
   Value: $JWT_SECRET

   Name: JWT_REFRESH_SECRET
   Value: $JWT_REFRESH_SECRET

   Name: DB_PASSWORD
   Value: $DB_PASSWORD

   Name: REDIS_PASSWORD
   Value: $REDIS_PASSWORD
────────────────────────────────────────────────────

Para Docker Compose Producción (.env.production):
────────────────────────────────────────────────────
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# PostgreSQL
DB_HOST=postgres
DB_PORT=5432
DB_USER=ciber_admin
DB_PASSWORD=$DB_PASSWORD
DB_NAME=ciber_platform
DATABASE_URL=postgresql://ciber_admin:$DB_PASSWORD@postgres:5432/ciber_platform

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379
────────────────────────────────────────────────────

Otros Secrets Requeridos (GitHub Actions):
────────────────────────────────────────────────────
# Servidor de producción (generar con ssh-keygen)
PROD_SERVER_HOST=tu-servidor.com
PROD_SERVER_USER=ubuntu
SSH_PRIVATE_KEY=<contenido de ~/.ssh/id_rsa>

# Email (para alertas y password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=<app password de Gmail>

# Notificaciones (crear webhook en Slack/Discord)
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cloud Backups (opcional)
BACKUP_S3_BUCKET=tu-bucket-backups
AWS_ACCESS_KEY_ID=<tu-access-key>
AWS_SECRET_ACCESS_KEY=<tu-secret-key>
AWS_REGION=us-east-1
────────────────────────────────────────────────────

Seguridad:
────────────────────────────────────────────────────
✓ Todos los secretos generados con openssl rand (criptográficamente seguros)
✓ JWT_SECRET y JWT_REFRESH_SECRET: 64 caracteres (muy seguro)
✓ DB_PASSWORD y REDIS_PASSWORD: 32 caracteres (seguro)
✓ Caracteres usados: [A-Za-z0-9]
✓ Sin caracteres especiales que puedan causar problemas en shell

Próximos Pasos:
────────────────────────────────────────────────────
1. Copia estos secretos a tu archivo .env local
2. Agrega estos secretos a GitHub → Settings → Secrets
3. NO commitees este archivo a git
4. Guarda este archivo en un password manager (1Password, LastPass, etc.)
5. Comparte con tu equipo de forma segura (no por email/Slack)
6. Destruye este archivo cuando termines: rm $SECRETS_FILE

Rotación de Secretos:
────────────────────────────────────────────────────
- JWT secrets: Rotar cada 6 meses
- DB password: Rotar cada 3 meses
- Redis password: Rotar cada 3 meses
- Rotar inmediatamente si hay sospecha de compromiso

═══════════════════════════════════════════════════
EOF

# Mostrar secretos en terminal
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Secretos generados exitosamente${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""

echo -e "${BLUE}Secretos (también guardados en $SECRETS_FILE):${NC}"
echo ""
echo -e "${YELLOW}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""
echo -e "${YELLOW}JWT_REFRESH_SECRET:${NC}"
echo "$JWT_REFRESH_SECRET"
echo ""
echo -e "${YELLOW}DB_PASSWORD:${NC}"
echo "$DB_PASSWORD"
echo ""
echo -e "${YELLOW}REDIS_PASSWORD:${NC}"
echo "$REDIS_PASSWORD"
echo ""

# Instrucciones para uso
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PRÓXIMOS PASOS:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}1. Para Desarrollo Local:${NC}"
echo "   cp .env.example .env"
echo "   # Luego edita .env y pega los secretos generados"
echo ""
echo -e "${YELLOW}2. Para GitHub Actions:${NC}"
echo "   Ve a: https://github.com/<tu-usuario>/<tu-repo>/settings/secrets/actions"
echo "   Agrega cada secreto usando los valores de arriba"
echo ""
echo -e "${YELLOW}3. Para Servidor de Producción:${NC}"
echo "   scp .env.production usuario@servidor:/opt/plataforma/"
echo "   # Asegúrate de que solo root/tu-usuario tenga acceso:"
echo "   ssh usuario@servidor 'chmod 600 /opt/plataforma/.env.production'"
echo ""
echo -e "${YELLOW}4. Verificar Seguridad:${NC}"
echo "   # Nunca commitees archivos con secretos:"
echo "   git status  # Verifica que no estén en staged"
echo "   # Agrega al .gitignore si no está:"
echo "   echo '.env*' >> .gitignore"
echo "   echo 'generated-secrets-*.txt' >> .gitignore"
echo ""
echo -e "${RED}⚠️  IMPORTANTE:${NC}"
echo -e "${RED}   - NO commitees $SECRETS_FILE a git${NC}"
echo -e "${RED}   - Guarda estos secretos en un password manager${NC}"
echo -e "${RED}   - Rota los secretos cada 3-6 meses${NC}"
echo -e "${RED}   - Borra este archivo cuando termines: rm $SECRETS_FILE${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Generación completada${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
