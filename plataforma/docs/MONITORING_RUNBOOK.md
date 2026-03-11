# 📊 Monitoring Runbook - Plataforma Ciber

**Versión:** 1.0.0
**Stack:** Prometheus + Grafana + Alertmanager
**Última Actualización:** Marzo 2026

---

## 📋 Accesos Rápidos

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Grafana** | http://localhost:3100 | admin / (ver .env) |
| **Prometheus** | http://localhost:9090 | N/A |
| **Alertmanager** | http://localhost:9093 | N/A |
| **Node Exporter** | http://localhost:9100/metrics | N/A |
| **Postgres Exporter** | http://localhost:9187/metrics | N/A |

---

## 🚨 Respuesta a Alertas

### ALERT: HighCPUUsage

**Severidad:** Warning
**Threshold:** > 80% por 5 minutos

**Diagnóstico:**

```bash
# 1. Verificar consumo actual
docker stats --no-stream

# 2. Identificar proceso problemático
docker exec ciber-backend-prod top -b -n 1 | head -20

# 3. Ver queries lentas en DB
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds'
   ORDER BY duration DESC LIMIT 10;"
```

**Resolución:**

```bash
# Opción 1: Escalar recursos (temporal)
# Aumentar CPU limit en docker-compose.yml
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# Opción 2: Kill proceso problemático
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT pg_terminate_backend(PID_AQUI);"

# Opción 3: Restart servicio
docker-compose restart backend
```

---

### ALERT: HighMemoryUsage

**Severidad:** Warning
**Threshold:** > 85% por 5 minutos

**Diagnóstico:**

```bash
# 1. Ver uso de memoria
free -h
docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}"

# 2. Ver procesos por memoria
ps aux --sort=-%mem | head -10

# 3. Ver cache de Redis
docker exec ciber-redis-prod redis-cli --no-auth-warning -a $REDIS_PASSWORD info memory
```

**Resolución:**

```bash
# Opción 1: Limpiar cache de Redis
docker exec ciber-redis-prod redis-cli --no-auth-warning -a $REDIS_PASSWORD FLUSHDB

# Opción 2: Restart servicios
docker-compose restart backend frontend

# Opción 3: Limpiar sistema
docker system prune -af --volumes
```

---

### ALERT: PostgresDown

**Severidad:** Critical
**Duración:** > 1 minuto

**Diagnóstico:**

```bash
# 1. Verificar estado del contenedor
docker ps -a | grep postgres

# 2. Ver logs
docker logs ciber-postgres-prod --tail 50

# 3. Verificar puerto
netstat -tulpn | grep 5432
```

**Resolución:**

```bash
# Opción 1: Restart
docker-compose restart postgres
sleep 30

# Opción 2: Si no arranca - Ver configuración
docker exec ciber-postgres-prod cat /var/lib/postgresql/data/postgresql.conf

# Opción 3: Último recurso - Restaurar desde backup
# Ver DISASTER_RECOVERY.md - ESCENARIO 1
```

---

### ALERT: HighDatabaseConnections

**Severidad:** Warning
**Threshold:** > 80% de max_connections

**Diagnóstico:**

```bash
# 1. Ver conexiones actuales
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT count(*) FROM pg_stat_activity;"

# 2. Ver conexiones por estado
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# 3. Ver conexiones idle
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT pid, usename, datname, state, query_start
   FROM pg_stat_activity
   WHERE state = 'idle' AND now() - query_start > interval '10 minutes';"
```

**Resolución:**

```bash
# Opción 1: Matar conexiones idle
docker exec ciber-postgres-prod psql -U $DB_USER -d $DB_NAME -c \
  "SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'idle' AND now() - query_start > interval '10 minutes';"

# Opción 2: Aumentar max_connections (requiere restart)
# Editar postgresql.conf
# max_connections = 200  # Era 100

docker-compose restart postgres
```

---

## 📈 Dashboards de Grafana

### Dashboard: Platform Overview

**Métricas Clave:**

1. **CPU Usage**: 100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
2. **Memory Usage**: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
3. **HTTP Request Rate**: rate(http_requests_total[5m])
4. **Response Time P95**: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

**Interpretación:**

- **CPU < 70%**: ✅ Normal
- **CPU 70-85%**: ⚠️  Monitored
- **CPU > 85%**: 🚨 Critical

- **Memory < 80%**: ✅ Normal
- **Memory 80-90%**: ⚠️  Warning
- **Memory > 90%**: 🚨 Critical

---

### Dashboard: Database Metrics

**Métricas Clave:**

1. **Active Connections**: pg_stat_database_numbackends
2. **Database Size**: pg_database_size_bytes
3. **Transaction Rate**: rate(pg_stat_database_xact_commit[5m])
4. **Cache Hit Ratio**: pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)

**Cache Hit Ratio:**
- **> 95%**: ✅ Excelente
- **90-95%**: ⚠️  Aceptable
- **< 90%**: 🚨 Investigar queries

---

## 🔍 Queries Útiles de Prometheus

### Ver Servicios Activos

```promql
up{job="backend-api"}
```

### Request Rate por Endpoint

```promql
rate(http_requests_total[5m])
```

### Error Rate (5xx)

```promql
rate(http_requests_total{status=~"5.."}[5m]) /
rate(http_requests_total[5m]) * 100
```

### P95 Response Time

```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Database Connection Pool

```promql
pg_stat_database_numbackends /
pg_settings_max_connections * 100
```

---

## 🛠️ Troubleshooting

### Prometheus No Scraping

**Síntomas:**
- Métricas no aparecen en Grafana
- Targets en estado "DOWN" en Prometheus

**Solución:**

```bash
# 1. Verificar targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.health != "up")'

# 2. Ver configuración
docker exec ciber-prometheus cat /etc/prometheus/prometheus.yml

# 3. Reload configuración
curl -X POST http://localhost:9090/-/reload

# 4. Ver logs
docker logs ciber-prometheus --tail 50
```

---

### Grafana No Muestra Datos

**Síntomas:**
- Panels en blanco
- "No data" en dashboards

**Solución:**

```bash
# 1. Verificar datasource
curl http://localhost:3100/api/datasources

# 2. Test conexión a Prometheus
curl http://prometheus:9090/api/v1/query?query=up

# 3. Ver logs de Grafana
docker logs ciber-grafana --tail 50

# 4. Re-provisionar datasources
docker-compose restart grafana
```

---

## 📊 Métricas Personalizadas

### Agregar Métrica al Backend

```typescript
// backend/src/middleware/metrics.ts
import promClient from 'prom-client';

export const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// En tu endpoint
httpRequestsTotal.inc({ method: 'GET', route: '/api/courses', status: '200' });
```

### Exponer Métricas

```typescript
// backend/src/routes/metrics.routes.ts
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

---

## ⏰ Mantenimiento Regular

### Diario

```bash
# Verificar alertas activas
curl http://localhost:9093/api/v1/alerts | jq '.data[] | select(.state == "firing")'

# Ver dashboards críticos
open http://localhost:3100/d/ciber-platform-overview
```

### Semanal

```bash
# Revisar métricas de rendimiento
# - Response times
# - Error rates
# - Database performance

# Cleanup de métricas antiguas (Prometheus retention: 30 días)
# Automático, verificar tamaño:
du -sh prometheus_data/
```

### Mensual

```bash
# Review de alertas
# - ¿Cuáles dispararon más?
# - ¿Falsos positivos?
# - ¿Ajustar thresholds?

# Actualizar dashboards según necesidad
# Exportar desde Grafana UI → Save → Export

# Backup de configuraciones
tar -czf monitoring-config-$(date +%Y%m).tar.gz \
  prometheus/ grafana/provisioning/ grafana/dashboards/
```

---

**Última Revisión:** Marzo 10, 2026
**Próxima Revisión:** Abril 10, 2026
