.PHONY: help install build sandbox up down logs test clean

help: ## Mostrar ayuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependencias
	npm install

build: ## Compilar TypeScript
	npm run build

sandbox: ## Construir imagen sandbox
	docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
	@echo "Sandbox image built successfully!"

up: sandbox ## Iniciar servicios en desarrollo
	docker-compose up -d
	@echo "Services started. Logs: make logs"

down: ## Detener servicios
	docker-compose down

restart: down up ## Reiniciar servicios

logs: ## Ver logs en tiempo real
	docker-compose logs -f executor

logs-redis: ## Ver logs de Redis
	docker-compose logs -f redis

status: ## Ver estado de servicios
	docker-compose ps

test: ## Ejecutar tests
	npm test

dev: ## Ejecutar en modo desarrollo local (sin Docker)
	npm run dev

clean: ## Limpiar contenedores y volúmenes
	docker-compose down -v
	docker ps -a | grep ciber-sandbox | awk '{print $$1}' | xargs -r docker rm -f
	rm -rf dist node_modules logs/*.log

clean-all: clean ## Limpieza completa incluyendo imágenes
	docker rmi -f ciber-sandbox:latest 2>/dev/null || true
	docker rmi -f ciber-executor:latest 2>/dev/null || true

health: ## Verificar health del servicio
	@curl -s http://localhost:5000/health | jq .

languages: ## Ver lenguajes soportados
	@curl -s http://localhost:5000/languages | jq .

example-python: ## Ejecutar ejemplo Python
	@curl -X POST http://localhost:5000/execute \
		-H "Content-Type: application/json" \
		-H "X-User-Id: test-user" \
		-d '{"code":"print(\"Hello from Python!\")", "language":"python"}' | jq .

example-js: ## Ejecutar ejemplo JavaScript
	@curl -X POST http://localhost:5000/execute \
		-H "Content-Type: application/json" \
		-H "X-User-Id: test-user" \
		-d '{"code":"console.log(\"Hello from JavaScript!\")", "language":"javascript"}' | jq .

example-bash: ## Ejecutar ejemplo Bash
	@curl -X POST http://localhost:5000/execute \
		-H "Content-Type: application/json" \
		-H "X-User-Id: test-user" \
		-d '{"code":"echo \"Hello from Bash!\"", "language":"bash"}' | jq .
