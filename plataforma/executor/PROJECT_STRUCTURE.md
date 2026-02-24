# Project Structure

Estructura completa del proyecto Executor Service.

```
executor/
├── src/                          # Código fuente TypeScript
│   ├── config/                   # Configuración
│   │   └── index.ts             # Validación y exports de config con Zod
│   ├── middleware/               # Express middleware
│   │   ├── errorHandler.ts     # Manejo global de errores
│   │   ├── rateLimit.ts        # Rate limiting con Redis
│   │   └── requestValidator.ts  # Validación de requests
│   ├── services/                 # Lógica de negocio
│   │   ├── dockerExecutor.ts   # Ejecución en Docker (CORE)
│   │   └── validator.ts        # Validación de tests
│   ├── types/                    # Definiciones de tipos TypeScript
│   │   └── index.ts            # Tipos principales
│   ├── utils/                    # Utilidades
│   │   ├── logger.ts           # Winston logger
│   │   └── metrics.ts          # Métricas de ejecución
│   ├── index.ts                 # Entry point (exports públicos)
│   └── server.ts                # Express server (MAIN)
│
├── examples/                     # Ejemplos de uso
│   ├── python_example.json      # Ejemplo Python con tests
│   ├── javascript_example.json  # Ejemplo JavaScript
│   └── bash_example.json        # Ejemplo Bash
│
├── scripts/                      # Scripts de utilidad
│   ├── setup.sh                # Setup inicial del proyecto
│   ├── build-sandbox.sh        # Construir imagen Docker
│   ├── test-api.sh             # Tests automáticos de API
│   ├── cleanup.sh              # Limpiar containers
│   └── monitor.sh              # Monitorear servicio
│
├── logs/                         # Logs (generado en runtime)
│   ├── combined.log            # Todos los logs
│   └── error.log               # Solo errores
│
├── dist/                         # Compilado TypeScript (generado)
│   └── ...                     # Archivos .js compilados
│
├── node_modules/                 # Dependencias npm (generado)
│
├── Dockerfile                    # Multi-stage para producción
├── Dockerfile.sandbox           # Imagen segura para ejecutar código
├── docker-compose.yml           # Orquestación local
├── package.json                 # Dependencias y scripts npm
├── tsconfig.json                # Configuración TypeScript
├── nodemon.json                 # Configuración nodemon
├── jest.config.js               # Configuración Jest
├── Makefile                     # Comandos útiles
├── .env.example                 # Variables de entorno ejemplo
├── .gitignore                   # Ignorar archivos en Git
├── .dockerignore                # Ignorar archivos en Docker
├── .eslintrc.js                 # Configuración ESLint
├── .prettierrc                  # Configuración Prettier
├── .editorconfig                # Configuración editor
├── LICENSE                      # Licencia MIT
├── README.md                    # Documentación principal
├── QUICKSTART.md               # Guía rápida
├── SECURITY.md                 # Política de seguridad
├── CONTRIBUTING.md             # Guía de contribución
├── CHANGELOG.md                # Registro de cambios
└── PROJECT_STRUCTURE.md        # Este archivo

```

## Descripción de Directorios

### `/src` - Código Fuente

Todo el código TypeScript del servicio.

#### `/src/config`
- Configuración central de la aplicación
- Validación de variables de entorno con Zod
- Configuraciones de lenguajes soportados

#### `/src/middleware`
- **errorHandler.ts**: Manejo centralizado de errores
- **rateLimit.ts**: Limitación de requests con Redis
- **requestValidator.ts**: Validación de inputs con Zod

#### `/src/services`
- **dockerExecutor.ts**: Servicio principal que ejecuta código en Docker
  - Creación de containers
  - Copia de código
  - Ejecución con timeout
  - Cleanup garantizado
- **validator.ts**: Valida output contra tests esperados

#### `/src/types`
- Definiciones de tipos TypeScript
- Interfaces para requests, responses, configs

#### `/src/utils`
- **logger.ts**: Logger Winston configurado
- **metrics.ts**: Recolección de métricas de ejecución

### `/examples` - Ejemplos

Ejemplos de requests JSON para cada lenguaje:
- Python con Fibonacci
- JavaScript con arrays
- Bash con comandos

### `/scripts` - Scripts de Utilidad

Scripts bash para tareas comunes:
- **setup.sh**: Setup inicial completo
- **build-sandbox.sh**: Construir imagen Docker
- **test-api.sh**: Tests automáticos
- **cleanup.sh**: Limpiar resources
- **monitor.sh**: Monitoreo en tiempo real

### `/logs` - Logs

Generado automáticamente:
- **combined.log**: Todos los logs
- **error.log**: Solo errores
- Rotación automática (5MB max)

### `/dist` - Build

Código TypeScript compilado a JavaScript.
Generado con `npm run build`.

## Archivos de Configuración

### Docker

- **Dockerfile**: Multi-stage build para dev y prod
- **Dockerfile.sandbox**: Imagen Alpine segura para ejecutar código
- **docker-compose.yml**: Orquestación con Redis

### Node.js

- **package.json**: Dependencias y scripts
- **tsconfig.json**: Configuración TypeScript estricta
- **nodemon.json**: Hot reload en desarrollo

### Testing

- **jest.config.js**: Configuración Jest para tests

### Linting/Formatting

- **.eslintrc.js**: Reglas ESLint
- **.prettierrc**: Formato de código
- **.editorconfig**: Configuración de editor

### Build/Deploy

- **Makefile**: Comandos shortcuts
- **.dockerignore**: Optimizar build Docker
- **.gitignore**: Ignorar archivos en Git

## Flujo de Ejecución

```
Request HTTP
    ↓
Express Server (server.ts)
    ↓
Middleware Chain:
  - Request Logging
  - CORS
  - Body Parser
  - Rate Limiter
  - Request Validator
    ↓
Endpoint Handler (/execute)
    ↓
DockerExecutor Service
    ↓
Create Container → Copy Code → Execute → Validate → Cleanup
    ↓
Response JSON
```

## Dependencias Principales

### Producción
- **express**: Web framework
- **dockerode**: Docker API client
- **ioredis**: Redis client
- **zod**: Schema validation
- **winston**: Logger
- **cors**: CORS middleware

### Desarrollo
- **typescript**: TypeScript compiler
- **ts-node**: TypeScript execution
- **nodemon**: Hot reload
- **jest**: Testing framework
- **eslint**: Linting
- **prettier**: Code formatting

## Seguridad

### Capas de Seguridad

1. **Input Validation** (requestValidator.ts)
   - Validación con Zod
   - Límites de tamaño

2. **Rate Limiting** (rateLimit.ts)
   - 5 requests/minuto por usuario
   - Implementado con Redis

3. **Sandbox Isolation** (dockerExecutor.ts)
   - Contenedores efímeros
   - Sin red
   - Límites de recursos
   - Usuario no-root

4. **Error Handling** (errorHandler.ts)
   - No exponer información sensible
   - Logging seguro

## Métricas y Monitoreo

### Logs
- Winston logger multi-transporte
- Rotación automática
- Niveles: error, warn, info, debug

### Métricas (metrics.ts)
- Total de ejecuciones
- Rate de éxito/fallo
- Tiempos de ejecución (avg, p50, p90, p95, p99)
- Ejecuciones por lenguaje

### Health Check
- Endpoint: GET /health
- Verifica conectividad Docker
- Muestra uso de memoria
- Uptime del servicio

## Escalabilidad

### Horizontal Scaling
- Stateless (excepto rate limiting)
- Redis compartido entre instancias
- Load balancer compatible

### Vertical Scaling
- Configurar límites de recursos
- Ajustar workers según CPU
- Memory limits en Docker

## Testing

### Estructura de Tests

```
src/
  services/
    __tests__/
      dockerExecutor.test.ts
      validator.test.ts
  middleware/
    __tests__/
      rateLimit.test.ts
```

### Comandos

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

## Deployment

### Desarrollo
```bash
docker-compose up
```

### Producción
```bash
docker build -t executor:prod --target production .
docker run -p 5000:5000 executor:prod
```

### Kubernetes
```yaml
# Ver K8s manifests en deploy/k8s/
apiVersion: apps/v1
kind: Deployment
metadata:
  name: executor
spec:
  replicas: 3
  ...
```

## Mantenimiento

### Actualizar Dependencias
```bash
npm outdated
npm update
npm audit fix
```

### Limpiar Containers Antiguos
```bash
./scripts/cleanup.sh
```

### Rotar Logs Manualmente
```bash
mv logs/combined.log logs/combined.log.old
systemctl restart executor
```

### Backup Redis
```bash
docker exec redis redis-cli BGSAVE
```

## Referencias

- [Express Documentation](https://expressjs.com/)
- [Dockerode API](https://github.com/apocas/dockerode)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Zod Validation](https://zod.dev/)
- [Docker Security](https://docs.docker.com/engine/security/)
