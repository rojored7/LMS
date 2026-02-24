.PHONY: help start stop restart logs clean seed test status build deploy

# ===== COLORES PARA OUTPUT =====
GREEN  := $(shell echo "\033[0;32m")
YELLOW := $(shell echo "\033[0;33m")
RED    := $(shell echo "\033[0;31m")
BLUE   := $(shell echo "\033[0;34m")
RESET  := $(shell echo "\033[0m")

help:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BLUE)║     🎓 PLATAFORMA MULTI-CURSO - COMANDOS DISPONIBLES      ║$(RESET)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)📦 Gestión de Contenedores:$(RESET)"
	@echo "  $(YELLOW)make start$(RESET)       - Inicia toda la plataforma"
	@echo "  $(YELLOW)make stop$(RESET)        - Detiene todos los servicios"
	@echo "  $(YELLOW)make restart$(RESET)     - Reinicia la plataforma"
	@echo "  $(YELLOW)make build$(RESET)       - Reconstruye las imágenes Docker"
	@echo "  $(YELLOW)make clean$(RESET)       - Limpia containers y volúmenes"
	@echo ""
	@echo "$(GREEN)📊 Monitoreo:$(RESET)"
	@echo "  $(YELLOW)make logs$(RESET)        - Muestra logs en tiempo real"
	@echo "  $(YELLOW)make logs-backend$(RESET) - Logs del backend"
	@echo "  $(YELLOW)make logs-frontend$(RESET) - Logs del frontend"
	@echo "  $(YELLOW)make status$(RESET)      - Estado del proyecto y progreso"
	@echo ""
	@echo "$(GREEN)📚 Gestión de Contenido:$(RESET)"
	@echo "  $(YELLOW)make seed$(RESET)        - Importa curso de Ciberseguridad inicial"
	@echo "  $(YELLOW)make add-course$(RESET)  - Agregar nuevo curso (interactivo)"
	@echo "  $(YELLOW)make reset-db$(RESET)    - Reinicia base de datos"
	@echo ""
	@echo "$(GREEN)🧪 Testing:$(RESET)"
	@echo "  $(YELLOW)make test$(RESET)        - Ejecuta todos los tests"
	@echo "  $(YELLOW)make test-backend$(RESET) - Tests del backend"
	@echo "  $(YELLOW)make test-frontend$(RESET) - Tests del frontend"
	@echo "  $(YELLOW)make test-e2e$(RESET)     - Tests end-to-end"
	@echo ""
	@echo "$(GREEN)🛠️  Desarrollo:$(RESET)"
	@echo "  $(YELLOW)make shell-backend$(RESET) - Abre shell en container backend"
	@echo "  $(YELLOW)make shell-db$(RESET)     - Abre psql en PostgreSQL"
	@echo "  $(YELLOW)make migrate$(RESET)      - Ejecuta migraciones Prisma"
	@echo "  $(YELLOW)make backup$(RESET)       - Backup de base de datos"
	@echo ""
	@echo "$(GREEN)🚀 Producción:$(RESET)"
	@echo "  $(YELLOW)make deploy$(RESET)       - Deploy en producción"
	@echo ""

# ===== GESTIÓN DE CONTENEDORES =====

start:
	@echo "$(GREEN)🚀 Iniciando plataforma multi-curso...$(RESET)"
	@if not exist .env (copy .env.example .env && echo $(YELLOW)⚠️  Creado .env desde .env.example - Revisa la configuración$(RESET))
	docker-compose up -d
	@timeout /t 5 >nul
	@echo ""
	@echo "$(GREEN)✅ Plataforma disponible:$(RESET)"
	@echo "   $(BLUE)→$(RESET) Frontend:  http://localhost:3000"
	@echo "   $(BLUE)→$(RESET) Backend:   http://localhost:4000"
	@echo "   $(BLUE)→$(RESET) API Docs:  http://localhost:4000/api-docs"
	@echo "   $(BLUE)→$(RESET) Executor:  http://localhost:5000"
	@echo "   $(BLUE)→$(RESET) Nginx:     http://localhost"
	@echo ""
	@echo "$(YELLOW)💡 Usa 'make logs' para ver los logs$(RESET)"
	@echo "$(YELLOW)💡 Usa 'make seed' para importar el curso inicial$(RESET)"

stop:
	@echo "$(YELLOW)⏹️  Deteniendo servicios...$(RESET)"
	docker-compose down
	@echo "$(GREEN)✅ Servicios detenidos$(RESET)"

restart: stop start

build:
	@echo "$(BLUE)🔨 Reconstruyendo imágenes Docker...$(RESET)"
	docker-compose build --no-cache
	@echo "$(GREEN)✅ Imágenes reconstruidas$(RESET)"

clean:
	@echo "$(RED)🧹 Limpiando containers, volúmenes y cache...$(RESET)"
	@echo "$(YELLOW)⚠️  Esto eliminará TODOS los datos. ¿Continuar? [S/N]$(RESET)"
	@set /p confirm=
	@if /i "%confirm%"=="S" (docker-compose down -v && docker system prune -f && echo $(GREEN)✅ Limpieza completada$(RESET)) else (echo $(YELLOW)Cancelado$(RESET))

# ===== LOGS Y MONITOREO =====

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-executor:
	docker-compose logs -f executor

logs-db:
	docker-compose logs -f postgres

status:
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(BLUE)║              📊 ESTADO DEL PROYECTO                        ║$(RESET)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)🐳 Docker Containers:$(RESET)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)📈 Progreso de Desarrollo:$(RESET)"
	@cd docs\historias-usuario && dir /b completadas 2>nul | find /c /v "" > temp.txt && set /p COMPLETADAS=<temp.txt && del temp.txt && dir /b pendientes 2>nul | find /c /v "" > temp.txt && set /p PENDIENTES=<temp.txt && del temp.txt && echo   Completadas: %COMPLETADAS% && echo   Pendientes: %PENDIENTES%
	@echo ""

# ===== GESTIÓN DE CONTENIDO =====

seed:
	@echo "$(GREEN)📚 Importando curso de Ciberseguridad inicial...$(RESET)"
	docker-compose run --rm importer npm run seed:ciber-course
	@echo "$(GREEN)✅ Curso importado exitosamente$(RESET)"

add-course:
	@echo "$(BLUE)➕ Agregando nuevo curso...$(RESET)"
	docker-compose run --rm importer npm run add-course

reset-db:
	@echo "$(RED)🔄 Reiniciando base de datos...$(RESET)"
	@echo "$(YELLOW)⚠️  Esto eliminará TODOS los datos. ¿Continuar? [S/N]$(RESET)"
	@set /p confirm=
	@if /i "%confirm%"=="S" (docker-compose down postgres && docker volume rm plataforma_postgres_data && docker-compose up -d postgres && timeout /t 10 >nul && docker-compose run --rm importer npm run migrate && echo $(GREEN)✅ Base de datos reiniciada$(RESET)) else (echo $(YELLOW)Cancelado$(RESET))

# ===== TESTING =====

test:
	@echo "$(BLUE)🧪 Ejecutando todos los tests...$(RESET)"
	docker-compose exec backend npm run test
	docker-compose exec frontend npm run test -- --watchAll=false
	@echo "$(GREEN)✅ Tests completados$(RESET)"

test-backend:
	docker-compose exec backend npm run test

test-frontend:
	docker-compose exec frontend npm run test -- --watchAll=false

test-e2e:
	@echo "$(BLUE)🧪 Ejecutando tests E2E...$(RESET)"
	docker-compose exec frontend npm run test:e2e

coverage:
	@echo "$(BLUE)📊 Generando reporte de cobertura...$(RESET)"
	docker-compose exec backend npm run test:coverage
	docker-compose exec frontend npm run test -- --coverage --watchAll=false

# ===== DESARROLLO =====

shell-backend:
	docker-compose exec backend /bin/sh

shell-frontend:
	docker-compose exec frontend /bin/sh

shell-db:
	docker-compose exec postgres psql -U ciber_admin -d ciber_platform

shell-redis:
	docker-compose exec redis redis-cli -a redispass123

migrate:
	@echo "$(BLUE)🔄 Ejecutando migraciones Prisma...$(RESET)"
	docker-compose exec backend npx prisma migrate dev
	@echo "$(GREEN)✅ Migraciones aplicadas$(RESET)"

migrate-deploy:
	docker-compose exec backend npx prisma migrate deploy

prisma-studio:
	@echo "$(BLUE)📊 Abriendo Prisma Studio...$(RESET)"
	docker-compose exec backend npx prisma studio

backup:
	@echo "$(BLUE)💾 Creando backup de base de datos...$(RESET)"
	@for /f "tokens=1-3 delims=/ " %%a in ('date /t') do set mydate=%%c-%%b-%%a
	@for /f "tokens=1-2 delims=: " %%a in ('time /t') do set mytime=%%a-%%b
	docker-compose exec postgres pg_dump -U ciber_admin ciber_platform > database\backups\backup-%mydate%_%mytime%.sql
	@echo "$(GREEN)✅ Backup creado: database\backups\backup-%mydate%_%mytime%.sql$(RESET)"

# ===== PRODUCCIÓN =====

deploy:
	@echo "$(BLUE)🚀 Desplegando en producción...$(RESET)"
	@set NODE_ENV=production
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
	@echo "$(GREEN)✅ Deploy completado$(RESET)"

# ===== DESARROLLO DE HISTORIAS =====

next-story:
	@echo "$(BLUE)📖 Implementando próxima historia de usuario...$(RESET)"
	@echo "$(YELLOW)Esta funcionalidad ejecutará agentes para desarrollar la siguiente historia$(RESET)"
	@echo "$(YELLOW)Proximamente disponible...$(RESET)"
