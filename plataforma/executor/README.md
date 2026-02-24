# Ciber Executor Service

Servicio de ejecución segura de código en contenedores Docker aislados para la plataforma de ciberseguridad.

## Descripción

El Executor Service proporciona un entorno sandbox seguro para ejecutar código de usuario en múltiples lenguajes de programación (Python, JavaScript, Bash) con las siguientes características de seguridad:

- Aislamiento completo mediante contenedores Docker
- Límites estrictos de recursos (CPU, memoria)
- Sin acceso a red
- Timeouts configurables
- Rate limiting por usuario
- Validación automática de tests

## Características de Seguridad

### Aislamiento de Contenedores

- Usuario no-root (`sandbox`)
- Red deshabilitada
- Sin privilegios
- Capacidades del kernel eliminadas
- Sistema de archivos de solo lectura donde sea posible
- Cleanup garantizado después de cada ejecución

### Límites de Recursos

- **Memoria**: 256MB por defecto
- **CPU**: 1 core por defecto
- **Timeout**: 30 segundos por defecto (configurable)
- **Código**: Máximo 50KB

### Rate Limiting

- 5 ejecuciones por minuto por usuario (configurable)
- Implementado con Redis
- Headers informativos en respuestas

## Instalación

### Prerrequisitos

- Node.js 18+
- Docker instalado y ejecutándose
- Redis (para rate limiting)

### Setup

1. Instalar dependencias:
```bash
npm install
```

2. Construir imagen sandbox:
```bash
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

4. Compilar TypeScript:
```bash
npm run build
```

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm run build
npm start
```

## API Endpoints

### POST /execute

Ejecuta código en un sandbox seguro.

**Request Body:**
```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "tests": [
    {
      "expectedOutput": "Hello, World!",
      "type": "exact"
    }
  ],
  "timeout": 30000
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "stdout": "Hello, World!\n",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 1523,
    "passed": true,
    "testsResults": [
      {
        "test": {
          "expectedOutput": "Hello, World!",
          "type": "exact"
        },
        "passed": true,
        "actualOutput": "Hello, World!"
      }
    ]
  }
}
```

**Rate Limit Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 1234567890
```

### GET /health

Verifica el estado del servicio.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5,
  "docker": true,
  "memory": {
    "used": 45,
    "total": 128
  }
}
```

### GET /languages

Retorna los lenguajes soportados.

**Response:**
```json
{
  "success": true,
  "languages": ["python", "javascript", "bash"]
}
```

## Lenguajes Soportados

### Python
- Runtime: Python 3
- Extension: `.py`
- Comando: `python3 script.py`

### JavaScript
- Runtime: Node.js
- Extension: `.js`
- Comando: `node script.js`

### Bash
- Runtime: Bash shell
- Extension: `.sh`
- Comando: `bash script.sh`

## Tipos de Tests

### Exact Match
Compara la salida exactamente (después de normalizar espacios en blanco):
```json
{
  "expectedOutput": "42",
  "type": "exact"
}
```

### Contains
Verifica que la salida contenga el texto esperado:
```json
{
  "expectedOutput": "Success",
  "type": "contains"
}
```

### Regex
Valida la salida contra una expresión regular:
```json
{
  "expectedOutput": "^\\d{4}-\\d{2}-\\d{2}$",
  "type": "regex"
}
```

## Ejemplos de Uso

### Python con Tests
```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))",
    "language": "python",
    "tests": [
      {
        "expectedOutput": "55",
        "type": "exact"
      }
    ]
  }'
```

### JavaScript
```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "code": "console.log([1,2,3,4,5].reduce((a,b) => a+b, 0))",
    "language": "javascript"
  }'
```

### Bash
```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user123" \
  -d '{
    "code": "echo \"System: $(uname -s)\"\necho \"User: $(whoami)\"",
    "language": "bash"
  }'
```

## Configuración

Variables de entorno disponibles en `.env`:

| Variable | Descripción | Default |
|----------|-------------|---------|
| PORT | Puerto del servidor | 5000 |
| NODE_ENV | Entorno de ejecución | development |
| SANDBOX_TIMEOUT | Timeout de ejecución (ms) | 30000 |
| SANDBOX_MEMORY_LIMIT | Límite de memoria | 256m |
| SANDBOX_CPU_LIMIT | Límite de CPU (cores) | 1 |
| SANDBOX_NETWORK_DISABLED | Deshabilitar red | true |
| REDIS_URL | URL de conexión Redis | redis://localhost:6379 |
| RATE_LIMIT_MAX_REQUESTS | Máximo de requests | 5 |
| RATE_LIMIT_WINDOW_MS | Ventana de rate limit (ms) | 60000 |

## Troubleshooting

### Error: "Cannot connect to Docker daemon"

**Solución**: Verificar que Docker esté ejecutándose:
```bash
docker ps
```

### Error: "Image not found: ciber-sandbox:latest"

**Solución**: Construir la imagen sandbox:
```bash
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
```

### Error: "Rate limit exceeded"

**Solución**: Esperar a que se reinicie la ventana de rate limit (1 minuto por defecto) o ajustar `RATE_LIMIT_MAX_REQUESTS` en `.env`.

### Error: "Execution timeout"

**Solución**: El código tarda demasiado en ejecutarse. Optimizar el código o aumentar `SANDBOX_TIMEOUT` en `.env`.

### Redis connection failed

**Solución**: Verificar que Redis esté ejecutándose:
```bash
redis-cli ping
# Debería responder: PONG
```

### Containers no se limpian

**Solución**: Limpiar containers manualmente:
```bash
docker ps -a | grep ciber-sandbox | awk '{print $1}' | xargs docker rm -f
```

## Logs

Los logs se almacenan en:
- `logs/combined.log` - Todos los logs
- `logs/error.log` - Solo errores

Ver logs en tiempo real durante desarrollo:
```bash
npm run dev
```

## Testing

```bash
npm test
```

## Seguridad

### Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor NO la publiques públicamente. Envía un email a security@example.com.

### Mejores Prácticas

1. **Nunca** ejecutar el servicio con permisos de root
2. **Siempre** mantener Docker actualizado
3. **Configurar** rate limiting apropiado para tu caso de uso
4. **Monitorear** logs de seguridad regularmente
5. **Limitar** tamaño de código permitido según tus necesidades

## Arquitectura

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ HTTP POST /execute
       ▼
┌──────────────────┐
│  Express Server  │
│  - Validation    │
│  - Rate Limit    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Docker Executor  │
│  - Create        │
│  - Copy Code     │
│  - Execute       │
│  - Cleanup       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Docker Engine   │
│  - Isolated      │
│  - Limited       │
│  - Secure        │
└──────────────────┘
```

## Licencia

MIT

## Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Soporte

Para soporte, abre un issue en el repositorio o contacta al equipo de desarrollo.
