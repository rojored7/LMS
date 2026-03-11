# 🆘 Disaster Recovery Plan - Plataforma Ciber

**Versión:** 1.0.0
**RTO (Recovery Time Objective):** < 1 hora
**RPO (Recovery Point Objective):** < 24 horas
**Última Actualización:** Marzo 2026

---

## 📋 Tabla de Contenidos

1. [Tipos de Desastres](#tipos-de-desastres)
2. [Procedimientos de Recuperación](#procedimientos-de-recuperación)
3. [Contacts de Emergencia](#contactos-de-emergencia)
4. [Post-Recovery](#post-recovery)

---

## 🔥 Tipos de Desastres

### Nivel 1: Crítico (RTO: 15 minutos)
- Base de datos corrompida o inaccesible
- Servidor de producción completamente caído
- Pérdida total de datos

### Nivel 2: Alto (RTO: 1 hora)
- Deployment fallido sin rollback exitoso
- Servicios principales (backend/frontend) inoperables
- Certificados SSL expirados

### Nivel 3: Moderado (RTO: 4 horas)
- Performance degradado significativamente
- Volúmenes Docker corrompidos
- Redis inaccesible

---

## 🔧 Procedimientos de Recuperación

### ESCENARIO 1: Base de Datos Corrompida

**Síntomas:**
```
ERROR: database "ciber_platform" is being accessed by other users
FATAL: database connection failed
ERROR: relation "users" does not exist
```

**Procedimiento:**

```bash
# PASO 1: DETENER TODOS LOS SERVICIOS
docker-compose -f docker-compose.prod.yml stop backend executor

# PASO 2: IDENTIFICAR ÚLTIMO BACKUP VÁLIDO
ls -lh database/backups/ | grep postgres
# Seleccionar el más reciente que NO esté corrupto

# PASO 3: VERIFICAR INTEGRIDAD DEL BACKUP
BACKUP_FILE="database/backups/postgres_20260310_020000.sql.gz"
gunzip -t "$BACKUP_FILE"  # Debe salir sin errores

# PASO 4: DETENER POSTGRES
docker-compose -f docker-compose.prod.yml stop postgres

# PASO 5: ELIMINAR VOLUMEN CORRUPTO
docker volume rm plataforma_postgres_data
docker volume create plataforma_postgres_data

# PASO 6: REINICIAR POSTGRES
docker-compose -f docker-compose.prod.yml up -d postgres
# Esperar 30 segundos

# PASO 7: RESTAURAR DESDE BACKUP
gunzip -c "$BACKUP_FILE" | \
  docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME

# PASO 8: VALIDAR RESTAURACIÓN
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM courses;"

# PASO 9: REINICIAR SERVICIOS
docker-compose -f docker-compose.prod.yml up -d backend executor

# PASO 10: SMOKE TEST
curl https://plataforma-ciber.com/api/health
curl https://plataforma-ciber.com/api/courses
```

**Tiempo Estimado:** 10-15 minutos
**Data Loss:** Hasta últimas 24h (según RPO)

---

### ESCENARIO 2: Servidor de Producción Caído Completamente

**Síntomas:**
- No responde a ping
- SSH timeout
- Sitio web completamente inaccesible

**Procedimiento:**

```bash
# PASO 1: VERIFICAR CONECTIVIDAD
ping your-server-ip
ssh deploy@your-server-ip

# PASO 2: CONTACTAR PROVEEDOR DE HOSTING
# - AWS: Support ticket
# - DigitalOcean: Open ticket
# - Hetzner: Contact support

# PASO 3: MIENTRAS TANTO - LEVANTAR SERVIDOR DE RESPALDO
# (Requiere servidor de respaldo pre-configurado)

# En servidor de respaldo:
cd /opt/plataforma
git pull origin main
export $(cat .env.backup | xargs)

# PASO 4: RESTAURAR DESDE BACKUPS EN LA NUBE
# Opción A: Desde S3
aws s3 sync s3://plataforma-ciber-backups/latest/ database/backups/

# Opción B: Desde GitHub Artifacts
# Descargar último backup artifact desde Actions

# PASO 5: RESTAURAR BASE DE DATOS
LATEST_BACKUP=$(ls -t database/backups/postgres_*.gz | head -1)
docker-compose up -d postgres redis
sleep 30
gunzip -c "$LATEST_BACKUP" | \
  docker exec -i ciber-postgres psql -U $DB_USER -d $DB_NAME

# PASO 6: LEVANTAR SERVICIOS
docker-compose -f docker-compose.prod.yml up -d

# PASO 7: ACTUALIZAR DNS
# Apuntar plataforma-ciber.com al nuevo servidor IP

# PASO 8: OBTENER NUEVO CERTIFICADO SSL
./scripts/renew-ssl.sh --force

# PASO 9: VERIFICAR FUNCIONALIDAD
curl https://plataforma-ciber.com/health
```

**Tiempo Estimado:** 30-60 minutos
**Requiere:** Servidor de respaldo o nuevo servidor

---

### ESCENARIO 3: Deployment Fallido Sin Rollback

**Síntomas:**
```
✗ Deployment failed
✗ Automatic rollback failed
CRITICAL: Both blue and green environments down
```

**Procedimiento:**

```bash
# PASO 1: DIAGNOSTICAR ESTADO
docker ps -a | grep ciber

# PASO 2: VERIFICAR BACKUPS
ls -lh database/backups/pre-deployment*.gz

# PASO 3: FORZAR ROLLBACK MANUAL
# Opción A: Rollback script
./scripts/rollback.sh --to=blue --auto

# Opción B: Manual
# Determinar último entorno working
LAST_WORKING_ENV="blue"  # o "green"

# Generar upstream.conf manualmente
cat > nginx/upstream.conf <<EOF
upstream backend { server backend-${LAST_WORKING_ENV}:4000; }
upstream frontend { server frontend-${LAST_WORKING_ENV}:80; }
upstream executor { server executor-${LAST_WORKING_ENV}:5000; }
EOF

# Reload nginx
docker exec ciber-nginx-prod nginx -s reload

# Levantar entorno si está down
docker-compose -f docker-compose.${LAST_WORKING_ENV}.yml up -d

# PASO 4: RESTAURAR DB SI ES NECESARIO
BACKUP_FILE=$(ls -t database/backups/pre-deployment*.gz | head -1)
# Solo si migraciones fallaron
gunzip -c "$BACKUP_FILE" | \
  docker exec -i ciber-postgres-prod psql -U $DB_USER -d $DB_NAME

# PASO 5: SMOKE TEST
curl http://localhost/api/health
```

**Tiempo Estimado:** 5-10 minutos

---

### ESCENARIO 4: Certificado SSL Expirado

**Síntomas:**
```
ERR_CERT_DATE_INVALID
NET::ERR_CERT_AUTHORITY_INVALID
```

**Procedimiento:**

```bash
# PASO 1: VERIFICAR EXPIRACIÓN
openssl x509 -in nginx/ssl/certbot/conf/live/$DOMAIN/cert.pem \
  -noout -enddate

# PASO 2: RENOVAR INMEDIATAMENTE
./scripts/renew-ssl.sh --force

# PASO 3: SI FALLA - OBTENER NUEVO CERTIFICADO
docker-compose -f docker-compose.certbot.yml run --rm certbot-init

# PASO 4: RELOAD NGINX
docker exec ciber-nginx-prod nginx -s reload

# PASO 5: VERIFICAR
curl -I https://plataforma-ciber.com | grep "HTTP"
openssl s_client -connect plataforma-ciber.com:443 -servername plataforma-ciber.com
```

**Tiempo Estimado:** 2-5 minutos

---

### ESCENARIO 5: Pérdida Total de Volúmenes

**Síntomas:**
- Uploads de usuarios perdidos
- Certificados generados perdidos
- Logs desaparecidos

**Procedimiento:**

```bash
# PASO 1: DETENER SERVICIOS
docker-compose -f docker-compose.prod.yml stop

# PASO 2: RESTAURAR VOLÚMENES DESDE BACKUP
# Listar backups de volúmenes
ls -lh database/backups/volumes/

# PASO 3: RESTAURAR CADA VOLUMEN
VOLUME="plataforma_backend_uploads"
BACKUP="database/backups/volumes/${VOLUME}_20260310_020000.tar.gz"

# Recrear volumen
docker volume rm $VOLUME
docker volume create $VOLUME

# Restaurar contenido
docker run --rm \
  -v "${VOLUME}:/volume" \
  -v "$(pwd)/database/backups/volumes:/backup:ro" \
  alpine \
  sh -c "cd /volume && tar xzf /backup/$(basename $BACKUP)"

# PASO 4: REPETIR PARA TODOS LOS VOLÚMENES CRÍTICOS
# - plataforma_backend_uploads
# - plataforma_backend_public

# PASO 5: REINICIAR SERVICIOS
docker-compose -f docker-compose.prod.yml up -d
```

**Tiempo Estimado:** 15-30 minutos

---

## 📞 Contactos de Emergencia

### Equipo Técnico

| Rol | Nombre | Contacto | Horario |
|-----|--------|----------|---------|
| **DevOps Lead** | [Nombre] | +1-XXX-XXX-XXXX | 24/7 |
| **DBA** | [Nombre] | +1-XXX-XXX-XXXX | 24/7 |
| **Backend Lead** | [Nombre] | +1-XXX-XXX-XXXX | 9AM-6PM |
| **Security Lead** | [Nombre] | +1-XXX-XXX-XXXX | On-call |

### Proveedores

| Servicio | Contacto | URL |
|----------|----------|-----|
| **Hosting** | support@provider.com | https://support.provider.com |
| **DNS** | Cloudflare Support | https://dash.cloudflare.com |
| **AWS S3** | AWS Support | https://console.aws.amazon.com/support |
| **GitHub** | GitHub Support | https://support.github.com |

---

## ✅ Post-Recovery

### 1. Incident Report

```markdown
# INCIDENT REPORT

**Date:** YYYY-MM-DD HH:MM
**Type:** [DB Corruption / Server Down / etc]
**Severity:** [Critical / High / Moderate]
**Duration:** XX minutes
**Impact:** XXX usuarios afectados

## Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Recovery started
- HH:MM - Service restored

## Root Cause
[Descripción detallada]

## Recovery Actions
1. [Acción 1]
2. [Acción 2]

## Preventive Measures
- [ ] [Medida 1]
- [ ] [Medida 2]
```

### 2. Verificaciones Post-Recovery

```bash
# Health checks
curl https://plataforma-ciber.com/api/health
curl https://plataforma-ciber.com/api/health/ready

# Data integrity
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM courses; SELECT COUNT(*) FROM enrollments;"

# Backup system
./scripts/backup-to-cloud.sh --verify

# Monitoring
# Verificar Grafana: http://localhost:3100
# Verificar Prometheus: http://localhost:9090

# Security
./scripts/renew-ssl.sh --check
```

### 3. Comunicación con Usuarios

**Template de Email:**

```
Asunto: [Resuelto] Mantenimiento de Emergencia - Plataforma Ciber

Estimados usuarios,

El día [fecha] entre las [hora inicio] y [hora fin] experimentamos
una interrupción del servicio debido a [razón breve].

Estado actual: ✅ Completamente restaurado

Datos afectados: [Ninguno / Detalles]

Acciones tomadas:
- [Acción 1]
- [Acción 2]

Pedimos disculpas por las molestias ocasionadas.

Equipo Plataforma Ciber
```

---

**Última Revisión:** Marzo 10, 2026
**Test de DR Plan:** Último test: [Fecha], Próximo test: [Fecha]
