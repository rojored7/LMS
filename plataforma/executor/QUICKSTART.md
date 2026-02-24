# Quick Start Guide

Guía rápida para ejecutar el Executor Service en menos de 5 minutos.

## Requisitos Previos

- Docker instalado y ejecutándose
- Node.js 18+ instalado
- 5 minutos de tu tiempo

## Opción 1: Docker Compose (Recomendado)

### Paso 1: Construir la imagen sandbox

```bash
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
```

### Paso 2: Iniciar servicios

```bash
docker-compose up -d
```

### Paso 3: Verificar que funciona

```bash
curl http://localhost:5000/health
```

Deberías ver:
```json
{
  "status": "healthy",
  "docker": true
}
```

### Paso 4: Ejecutar código de ejemplo

```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-user" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'
```

Respuesta esperada:
```json
{
  "success": true,
  "result": {
    "stdout": "Hello, World!",
    "stderr": "",
    "exitCode": 0,
    "executionTime": 152,
    "passed": true
  }
}
```

### Paso 5: Ver logs

```bash
docker-compose logs -f executor
```

## Opción 2: Ejecución Local

### Paso 1: Instalar dependencias

```bash
npm install
```

### Paso 2: Crear archivo .env

```bash
cp .env.example .env
```

### Paso 3: Iniciar Redis (en otra terminal)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### Paso 4: Construir sandbox

```bash
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
```

### Paso 5: Iniciar servidor en modo desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5000`

## Ejemplos Rápidos

### Python

```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user1" \
  -d @examples/python_example.json
```

### JavaScript

```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user1" \
  -d @examples/javascript_example.json
```

### Bash

```bash
curl -X POST http://localhost:5000/execute \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user1" \
  -d @examples/bash_example.json
```

## Makefile Commands (Atajos)

Si tienes `make` instalado:

```bash
# Setup completo
make install
make sandbox
make up

# Ver logs
make logs

# Ejecutar ejemplos
make example-python
make example-js
make example-bash

# Ver estado de salud
make health

# Limpiar todo
make clean
```

## Verificar Instalación

### Test automatizado

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

Deberías ver todos los tests en verde.

### Endpoints disponibles

1. **POST /execute** - Ejecuta código
2. **GET /health** - Estado del servicio
3. **GET /languages** - Lenguajes soportados

## Troubleshooting

### "Cannot connect to Docker daemon"

**Solución**: Asegúrate de que Docker esté ejecutándose:
```bash
docker ps
```

### "Image not found: ciber-sandbox:latest"

**Solución**: Construye la imagen:
```bash
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
```

### "Rate limit exceeded"

**Solución**: Espera 1 minuto o cambia el User-ID:
```bash
-H "X-User-Id: user2"
```

### "Connection refused on port 5000"

**Solución**: Verifica que el servidor esté corriendo:
```bash
docker-compose ps
# o
ps aux | grep node
```

## Siguientes Pasos

1. Lee el [README.md](README.md) completo para documentación detallada
2. Revisa [SECURITY.md](SECURITY.md) para entender las medidas de seguridad
3. Consulta [CONTRIBUTING.md](CONTRIBUTING.md) si quieres contribuir

## Detener el Servicio

### Con Docker Compose

```bash
docker-compose down
```

### Localmente

Presiona `Ctrl+C` en la terminal donde corre el servidor, luego:

```bash
docker stop $(docker ps -q --filter "ancestor=ciber-sandbox:latest")
```

## Preguntas Frecuentes

### ¿Puedo cambiar el puerto?

Sí, edita `.env`:
```
PORT=8080
```

### ¿Cómo aumento el timeout?

En tu request JSON:
```json
{
  "code": "...",
  "language": "python",
  "timeout": 60000
}
```

### ¿Cómo veo todos los contenedores?

```bash
docker ps -a | grep ciber-sandbox
```

### ¿Cómo limpio contenedores viejos?

```bash
./scripts/cleanup.sh
```

## Soporte

Si encuentras problemas:

1. Verifica los logs: `docker-compose logs executor`
2. Revisa el archivo `logs/error.log`
3. Abre un issue en el repositorio
4. Consulta la sección Troubleshooting del README.md

---

**¡Listo!** Ahora tienes el Executor Service funcionando. Disfruta ejecutando código de forma segura.
