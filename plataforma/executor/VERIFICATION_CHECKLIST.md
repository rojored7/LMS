# Verification Checklist

Lista de verificación para asegurar que el servicio Executor está correctamente configurado y funcionando.

## Pre-requisitos

- [ ] Docker instalado y ejecutándose
  ```bash
  docker --version
  docker ps
  ```

- [ ] Node.js 18+ instalado
  ```bash
  node --version  # Debería ser v18.x o superior
  npm --version
  ```

- [ ] Redis disponible (o Docker Compose para iniciarlo)
  ```bash
  redis-cli ping  # Debería responder PONG
  ```

## Instalación

- [ ] Dependencias instaladas
  ```bash
  cd C:\Users\Itac\Proyectos\Curso_ciber\plataforma\executor
  npm install
  ```

- [ ] Sin errores de instalación
  ```bash
  # Verificar que node_modules existe
  ls node_modules | head
  ```

- [ ] TypeScript compila correctamente
  ```bash
  npm run build
  # Debería crear carpeta dist/
  ```

## Configuración

- [ ] Archivo .env creado
  ```bash
  cp .env.example .env
  ```

- [ ] Variables de entorno configuradas
  - PORT=5000
  - REDIS_URL configurado
  - SANDBOX_TIMEOUT configurado
  - Otros valores revisados

- [ ] Imagen sandbox construida
  ```bash
  docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
  docker images | grep ciber-sandbox
  ```

## Estructura de Archivos

- [ ] Todos los archivos TypeScript presentes
  ```bash
  # Debería listar 11 archivos .ts
  find src -name "*.ts" | wc -l
  ```

- [ ] Carpeta de ejemplos creada
  ```bash
  ls examples/
  # Debería mostrar 3 archivos .json
  ```

- [ ] Scripts ejecutables
  ```bash
  ls scripts/
  # Debería mostrar 5 archivos .sh
  chmod +x scripts/*.sh
  ```

## Docker

- [ ] Imagen sandbox existe
  ```bash
  docker images | grep ciber-sandbox
  ```

- [ ] Imagen sandbox funciona
  ```bash
  docker run --rm ciber-sandbox:latest python3 --version
  docker run --rm ciber-sandbox:latest node --version
  docker run --rm ciber-sandbox:latest bash --version
  ```

- [ ] Usuario sandbox configurado
  ```bash
  docker run --rm ciber-sandbox:latest whoami
  # Debería mostrar: sandbox
  ```

## Servicios (Docker Compose)

- [ ] Docker Compose inicia correctamente
  ```bash
  docker-compose up -d
  ```

- [ ] Redis está corriendo
  ```bash
  docker-compose ps redis
  # Debería mostrar estado "Up"
  ```

- [ ] Executor está corriendo
  ```bash
  docker-compose ps executor
  # Debería mostrar estado "Up"
  ```

- [ ] Logs sin errores críticos
  ```bash
  docker-compose logs executor | grep ERROR
  # No debería mostrar errores críticos
  ```

## API Endpoints

- [ ] Health check responde
  ```bash
  curl http://localhost:5000/health
  # Debería retornar JSON con "status": "healthy"
  ```

- [ ] Endpoint languages responde
  ```bash
  curl http://localhost:5000/languages
  # Debería listar: python, javascript, bash
  ```

- [ ] Endpoint execute responde
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"print(1+1)","language":"python"}'
  # Debería retornar resultado exitoso
  ```

## Ejecución de Código

- [ ] Python ejecuta correctamente
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"print(\"Hello Python\")","language":"python"}'
  # stdout debería contener "Hello Python"
  ```

- [ ] JavaScript ejecuta correctamente
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"console.log(\"Hello JS\")","language":"javascript"}'
  # stdout debería contener "Hello JS"
  ```

- [ ] Bash ejecuta correctamente
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"echo \"Hello Bash\"","language":"bash"}'
  # stdout debería contener "Hello Bash"
  ```

## Seguridad

- [ ] Red deshabilitada en sandbox
  ```bash
  # Código que intenta acceder a la red debe fallar
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"import urllib.request; urllib.request.urlopen(\"http://google.com\")","language":"python"}'
  # Debería fallar con error de red
  ```

- [ ] Timeout funciona
  ```bash
  # Código con loop infinito debe hacer timeout
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"while True: pass","language":"python","timeout":2000}'
  # Debería retornar error de timeout
  ```

- [ ] Rate limiting funciona
  ```bash
  # Hacer 6 requests rápidos con el mismo User-Id
  for i in {1..6}; do
    curl -X POST http://localhost:5000/execute \
      -H "Content-Type: application/json" \
      -H "X-User-Id: test-rate" \
      -d '{"code":"print(1)","language":"python"}'
    echo ""
  done
  # El 6to debería retornar 429 (Rate limit exceeded)
  ```

- [ ] Usuario es sandbox (no root)
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"import os; print(os.getuid())","language":"python"}'
  # Debería mostrar UID 1000 (no 0)
  ```

## Validación de Tests

- [ ] Test exact funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{
      "code":"print(42)",
      "language":"python",
      "tests":[{"expectedOutput":"42","type":"exact"}]
    }'
  # passed debería ser true
  ```

- [ ] Test contains funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{
      "code":"print(\"The answer is 42\")",
      "language":"python",
      "tests":[{"expectedOutput":"42","type":"contains"}]
    }'
  # passed debería ser true
  ```

- [ ] Test regex funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{
      "code":"print(123)",
      "language":"python",
      "tests":[{"expectedOutput":"^[0-9]+$","type":"regex"}]
    }'
  # passed debería ser true
  ```

## Error Handling

- [ ] Lenguaje inválido rechazado
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"test","language":"ruby"}'
  # Debería retornar 400 con error de validación
  ```

- [ ] Código faltante rechazado
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"language":"python"}'
  # Debería retornar 400 con error de validación
  ```

- [ ] Código con error de sintaxis manejado
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"print(","language":"python"}'
  # Debería retornar exitCode != 0 y stderr con error
  ```

## Logging

- [ ] Logs se están generando
  ```bash
  # Si está en Docker Compose
  docker-compose logs executor | tail -n 20

  # Si está local
  tail -n 20 logs/combined.log
  ```

- [ ] Logs contienen información útil
  - Timestamp
  - Nivel de log
  - Mensaje descriptivo
  - Metadata relevante

- [ ] Logs de error separados
  ```bash
  cat logs/error.log
  # Solo debería contener logs de nivel error
  ```

## Cleanup

- [ ] Containers se limpian después de ejecución
  ```bash
  # Antes de ejecutar código
  BEFORE=$(docker ps -a | grep ciber-sandbox | wc -l)

  # Ejecutar código
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"print(1)","language":"python"}'

  # Esperar 2 segundos
  sleep 2

  # Después de ejecutar código
  AFTER=$(docker ps -a | grep ciber-sandbox | wc -l)

  # BEFORE debería ser igual a AFTER (sin containers residuales)
  ```

## Performance

- [ ] Ejecución simple < 3 segundos
  ```bash
  time curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d '{"code":"print(1)","language":"python"}'
  # real time debería ser < 3s
  ```

- [ ] Health check responde rápido
  ```bash
  time curl http://localhost:5000/health
  # Debería responder en < 500ms
  ```

## Tests Automatizados

- [ ] Script de tests ejecuta exitosamente
  ```bash
  chmod +x scripts/test-api.sh
  ./scripts/test-api.sh
  # Todos los tests deberían pasar (PASSED en verde)
  ```

## Ejemplos

- [ ] Ejemplo Python funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d @examples/python_example.json
  # Debería ejecutar Fibonacci correctamente
  ```

- [ ] Ejemplo JavaScript funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d @examples/javascript_example.json
  # Debería calcular suma y promedio
  ```

- [ ] Ejemplo Bash funciona
  ```bash
  curl -X POST http://localhost:5000/execute \
    -H "Content-Type: application/json" \
    -H "X-User-Id: test" \
    -d @examples/bash_example.json
  # Debería ejecutar comandos bash
  ```

## Documentación

- [ ] README.md está completo y actualizado
- [ ] QUICKSTART.md proporciona guía clara
- [ ] SECURITY.md documenta medidas de seguridad
- [ ] CONTRIBUTING.md explica cómo contribuir
- [ ] PROJECT_STRUCTURE.md describe la estructura
- [ ] Ejemplos están documentados
- [ ] Scripts tienen comentarios

## Problemas Comunes

### Si algo falla:

1. **Docker no conecta**
   ```bash
   # Verificar que Docker está corriendo
   docker ps
   # Si falla, iniciar Docker Desktop o dockerd
   ```

2. **Imagen sandbox no existe**
   ```bash
   # Construir imagen
   docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
   ```

3. **Puerto 5000 ocupado**
   ```bash
   # Cambiar puerto en .env
   PORT=5001
   ```

4. **Rate limit persiste**
   ```bash
   # Limpiar Redis
   docker-compose exec redis redis-cli FLUSHALL
   ```

5. **Containers no se limpian**
   ```bash
   # Limpieza manual
   ./scripts/cleanup.sh
   ```

## Resultado Final

Si todos los checkboxes están marcados:

✅ **El servicio Executor está completamente funcional y listo para uso!**

Si algunos fallan:

1. Revisar logs: `docker-compose logs executor`
2. Verificar configuración: `.env`
3. Consultar troubleshooting en README.md
4. Revisar SECURITY.md para temas de seguridad

## Comandos de Verificación Rápida

```bash
# Todo en uno
make health && \
make example-python && \
make example-js && \
make example-bash && \
echo "✅ All tests passed!"
```

---

**Última actualización:** 2024-01-15
