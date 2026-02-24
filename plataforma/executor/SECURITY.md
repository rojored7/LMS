# Security Policy

## Características de Seguridad

### 1. Aislamiento de Contenedores

El servicio ejecuta código de usuario en contenedores Docker completamente aislados con las siguientes restricciones:

#### Usuario No-Root
- El código se ejecuta como usuario `sandbox` (UID 1000)
- No tiene privilegios de superusuario
- No puede modificar el sistema host

#### Sin Acceso a Red
- `NetworkDisabled: true` - Sin conectividad de red
- No puede hacer requests HTTP/HTTPS
- No puede conectarse a bases de datos externas
- No puede exfiltrar datos

#### Capacidades del Kernel Eliminadas
- `CapDrop: ['ALL']` - Todas las capacidades del kernel eliminadas
- No puede montar sistemas de archivos
- No puede modificar la configuración de red
- No puede acceder a dispositivos raw

#### Sin Privilegios
- `Privileged: false` - Sin modo privilegiado
- No puede acceder al Docker daemon del host
- No puede escapar del contenedor

### 2. Límites de Recursos

#### Memoria
- Límite por defecto: 256MB
- Previene ataques de consumo de memoria
- Swap deshabilitado (`MemorySwap = Memory`)

#### CPU
- Límite por defecto: 1 core (1e9 nanocpus)
- Previene ataques de fork bomb
- Evita monopolización de CPU

#### Timeout
- Límite por defecto: 30 segundos
- Previene bucles infinitos
- Permite configuración por request (máx 60s)

#### Tamaño de Código
- Máximo: 50KB
- Previene ataques de recursos
- Validado antes de ejecución

### 3. Rate Limiting

#### Implementación
- Basado en Redis con sorted sets
- Ventana deslizante de tiempo
- Por usuario/IP

#### Configuración Default
- 5 requests por minuto por usuario
- Ventana de 60 segundos
- Headers informativos en respuestas

#### Identificación de Usuario
1. User ID de sesión autenticada (si existe)
2. Header `X-User-Id`
3. IP address (fallback)

### 4. Cleanup Garantizado

#### Siempre se Ejecuta
```typescript
try {
  // Ejecución
} finally {
  // Cleanup SIEMPRE se ejecuta
  await this.cleanup(container);
}
```

#### Proceso de Cleanup
1. Stop container (timeout 1s)
2. Remove container (force=true)
3. Remove volumes asociados
4. Logging de errores (no lanza excepciones)

### 5. Validación de Entrada

#### Esquema Zod
- Validación estricta de tipos
- Sanitización automática
- Límites de tamaño
- Lenguajes permitidos (whitelist)

#### Prevención de Inyección
- No se usa `eval()` o similares
- Código escrito a archivo primero
- Comando ejecutado con array (no string shell)

### 6. Logging y Monitoreo

#### Qué se Loguea
- Todas las ejecuciones (inicio/fin)
- Errores y excepciones
- Rate limit violations
- Eventos de seguridad
- Métricas de recursos

#### Información Sensible
- NO se loguea código completo (solo tamaño)
- NO se loguean tokens de autenticación
- Logs rotan automáticamente (5MB máx)

## Vectores de Ataque Mitigados

### 1. Escape de Contenedor
**Mitigación**:
- Usuario no-root
- Sin privilegios
- Capacidades eliminadas
- Sin acceso al socket de Docker

### 2. Denegación de Servicio (DoS)

#### CPU/Memory Exhaustion
**Mitigación**: Límites estrictos de recursos

#### Fork Bomb
**Mitigación**: Límites de procesos del cgroup

#### Bucles Infinitos
**Mitigación**: Timeout forzado

#### Rate Limit Bypass
**Mitigación**: Redis con sorted sets, identificación múltiple

### 3. Exfiltración de Datos
**Mitigación**:
- Sin acceso a red
- Sin acceso a filesystem del host
- Sin volúmenes montados

### 4. Inyección de Comandos
**Mitigación**:
- Validación con Zod
- Comandos como arrays (no shell strings)
- Lenguajes permitidos (whitelist)

### 5. Path Traversal
**Mitigación**:
- Código escrito en directorio específico
- Usuario sin permisos fuera de /sandbox
- ReadonlyRootfs donde sea posible

## Vulnerabilidades Conocidas

### Limitaciones Actuales

#### 1. Docker Daemon Requerido
- El servicio necesita acceso al socket de Docker
- Riesgo si el servicio es comprometido
- **Mitigación planeada**: Usar Docker API remota con TLS

#### 2. Imágenes Base
- Dependencia de `alpine:3.18`
- Posibles vulnerabilidades en paquetes instalados
- **Mitigación actual**: Actualizaciones regulares
- **Mitigación planeada**: Escaneo automático con Trivy

#### 3. Código Malicioso Dentro del Contenedor
- El código puede intentar operaciones maliciosas
- Aunque aislado, consume recursos
- **Mitigación actual**: Límites estrictos
- **Mitigación planeada**: Análisis estático antes de ejecución

## Reporte de Vulnerabilidades

### Proceso

1. **NO publicar públicamente**
2. Enviar email a: security@example.com
3. Incluir:
   - Descripción detallada
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencias de mitigación (opcional)

### Respuesta Esperada
- Confirmación: 24 horas
- Evaluación inicial: 72 horas
- Fix (si aplicable): 7-14 días
- Divulgación pública: Después del fix + 30 días

### Reconocimiento
- Hall of Fame en README
- Crédito en release notes
- Recompensa (según criticidad)

## Mejores Prácticas de Deployment

### 1. Infraestructura

```yaml
# Kubernetes ejemplo
apiVersion: v1
kind: Pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: executor
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: ["ALL"]
```

### 2. Variables de Entorno

```bash
# NUNCA hardcodear secrets
# Usar secrets management (Vault, K8s Secrets, etc)
REDIS_URL: FROM_SECRET
DATABASE_URL: FROM_SECRET
```

### 3. Network Policies

```yaml
# Solo permitir tráfico necesario
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
spec:
  podSelector:
    matchLabels:
      app: executor
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: api-gateway
```

### 4. Monitoreo

- Alertas en rate limit violations
- Alertas en timeouts frecuentes
- Alertas en uso de recursos inusual
- Logs centralizados (ELK, Splunk, etc)

### 5. Actualizaciones

- Dependencias: Semanalmente
- Imagen base: Mensualmente
- Escaneo de vulnerabilidades: Diariamente
- Parches críticos: Inmediatamente

## Checklist de Seguridad

### Pre-Deployment
- [ ] Variables de entorno configuradas correctamente
- [ ] Secrets no hardcodeados
- [ ] Rate limiting configurado apropiadamente
- [ ] Recursos del contenedor limitados
- [ ] Red deshabilitada en sandbox
- [ ] Usuario no-root configurado
- [ ] Logs configurados
- [ ] Health checks configurados

### Post-Deployment
- [ ] Monitoreo activo
- [ ] Alertas configuradas
- [ ] Backup de Redis configurado
- [ ] Rotación de logs funcionando
- [ ] Métricas recolectándose
- [ ] Documentación actualizada

### Mantenimiento Regular
- [ ] Revisar logs de seguridad semanalmente
- [ ] Actualizar dependencias mensualmente
- [ ] Revisar configuración de rate limit
- [ ] Verificar límites de recursos
- [ ] Auditar accesos y permisos
- [ ] Probar recuperación de desastres

## Recursos Adicionales

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [OWASP Container Security](https://owasp.org/www-project-docker-top-10/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Última Actualización

Este documento fue actualizado el: 2024-01-15

Próxima revisión programada: 2024-04-15
