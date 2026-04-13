.PHONY: help start stop restart logs clean seed test status build deploy

# ===== COLORES PARA OUTPUT =====
GREEN  := $(shell echo "\033[0;32m")
YELLOW := $(shell echo "\033[0;33m")
RED    := $(shell echo "\033[0;31m")
BLUE   := $(shell echo "\033[0;34m")
RESET  := $(shell echo "\033[0m")

help:
	@echo "$(BLUE)Plataforma Multi-Curso - Comandos$(RESET)"
	@echo ""
	@echo "$(GREEN)Contenedores:$(RESET)"
	@echo "  $(YELLOW)make start$(RESET)        - Inicia toda la plataforma"
	@echo "  $(YELLOW)make stop$(RESET)         - Detiene todos los servicios"
	@echo "  $(YELLOW)make restart$(RESET)      - Reinicia la plataforma"
	@echo "  $(YELLOW)make build$(RESET)        - Reconstruye imagenes Docker"
	@echo ""
	@echo "$(GREEN)Monitoreo:$(RESET)"
	@echo "  $(YELLOW)make logs$(RESET)         - Logs en tiempo real"
	@echo "  $(YELLOW)make logs-backend$(RESET)  - Logs del backend FastAPI"
	@echo "  $(YELLOW)make logs-frontend$(RESET) - Logs del frontend"
	@echo "  $(YELLOW)make status$(RESET)       - Estado de containers"
	@echo ""
	@echo "$(GREEN)Testing:$(RESET)"
	@echo "  $(YELLOW)make test$(RESET)         - Tests backend (pytest)"
	@echo "  $(YELLOW)make test-cov$(RESET)     - Tests con coverage"
	@echo "  $(YELLOW)make test-frontend$(RESET) - Tests del frontend"
	@echo ""
	@echo "$(GREEN)Base de datos:$(RESET)"
	@echo "  $(YELLOW)make migrate$(RESET)      - Ejecuta migraciones Alembic"
	@echo "  $(YELLOW)make shell-db$(RESET)     - Abre psql en PostgreSQL"
	@echo "  $(YELLOW)make backup$(RESET)       - Backup de base de datos"
	@echo ""

# ===== CONTENEDORES =====

start:
	@echo "$(GREEN)Iniciando plataforma...$(RESET)"
	docker-compose up -d
	@echo ""
	@echo "$(GREEN)Plataforma disponible:$(RESET)"
	@echo "  Frontend:  http://localhost:3000"
	@echo "  Backend:   http://localhost:4000"
	@echo "  API Docs:  http://localhost:4000/api-docs"

stop:
	docker-compose down

restart: stop start

build:
	docker-compose build --no-cache

clean:
	docker-compose down -v
	docker system prune -f

# ===== LOGS =====

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-executor:
	docker-compose logs -f executor

status:
	docker-compose ps

# ===== TESTING (FastAPI + pytest) =====

test:
	docker-compose exec backend python -m pytest tests/ -q --tb=short

test-cov:
	docker-compose exec backend python -m pytest tests/ --cov=app --cov-report=term-missing

test-frontend:
	docker-compose exec frontend npm run test -- --watchAll=false

# ===== BASE DE DATOS (Alembic) =====

migrate:
	docker-compose exec backend python -m alembic upgrade head

migrate-new:
	docker-compose exec backend python -m alembic revision --autogenerate -m "$(msg)"

shell-backend:
	docker-compose exec backend /bin/sh

shell-db:
	docker-compose exec postgres psql -U ciber_admin -d ciber_platform

backup:
	docker-compose exec postgres pg_dump -U ciber_admin ciber_platform > database/backups/backup-$$(date +%Y%m%d_%H%M%S).sql

# ===== CONTENIDO =====

seed:
	docker-compose exec backend python -m app.scripts.seed_base
	docker-compose exec backend python -m app.scripts.import_course --content-dir /content/contenidos/curso_ciberseguridad --publish --force

import-course:
	docker-compose exec backend python -m app.scripts.import_course --content-dir /content/contenidos/$(COURSE) --publish --verbose

import-course-dry:
	docker-compose exec backend python -m app.scripts.import_course --content-dir /content/contenidos/$(COURSE) --dry-run --verbose

# ===== DEPLOY =====

deploy:
	NODE_ENV=production docker-compose up -d --build
