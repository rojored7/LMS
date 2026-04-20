#!/bin/bash
# ===========================================
# Deployment Script for Ciber Platform
# Full rebuild + migration + health check
# ===========================================

set -e

echo "=========================================="
echo "  Starting deployment..."
echo "=========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Detect compose command
if docker compose version &>/dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# Configuration
COMPOSE_FILE="${1:-docker-compose.yml}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"

echo -e "${YELLOW}Using compose file: ${COMPOSE_FILE}${NC}"
echo -e "${YELLOW}Compose command: ${COMPOSE}${NC}"

# Step 1: Pull latest changes (if in git repo)
if [ -d ".git" ] || [ -d "../.git" ]; then
    echo -e "\n${YELLOW}Pulling latest changes from git...${NC}"
    git pull origin $(git branch --show-current) || {
        echo -e "${RED}Git pull failed. Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
else
    echo -e "${YELLOW}Not a git repository, skipping git pull${NC}"
fi

# Step 2: Create backup before deployment
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ] && [ -f "./scripts/backup-db.sh" ]; then
    echo -e "\n${YELLOW}Creating database backup...${NC}"
    ./scripts/backup-db.sh || {
        echo -e "${RED}Backup failed. Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
fi

# Step 3: Remove orphan containers
echo -e "\n${YELLOW}Cleaning up orphan containers...${NC}"
$COMPOSE -f "$COMPOSE_FILE" down --remove-orphans || true

# Step 4: Build images
echo -e "\n${YELLOW}Building Docker images...${NC}"
$COMPOSE -f "$COMPOSE_FILE" build --no-cache || {
    echo -e "${RED}Build failed!${NC}"
    exit 1
}

# Step 5: Start services
echo -e "\n${YELLOW}Starting services...${NC}"
$COMPOSE -f "$COMPOSE_FILE" up -d || {
    echo -e "${RED}Service start failed!${NC}"
    exit 1
}

# Step 6: Wait for services to be healthy
echo -e "\n${YELLOW}Waiting for services to be healthy...${NC}"
MAX_WAIT=90
WAITED=0
while [ $WAITED -lt $MAX_WAIT ]; do
    BE_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-backend-prod 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' ciber-backend 2>/dev/null || echo "missing")
    PG_OK=$(docker inspect --format='{{.State.Health.Status}}' ciber-postgres-prod 2>/dev/null || docker inspect --format='{{.State.Health.Status}}' ciber-postgres 2>/dev/null || echo "missing")

    if [ "$BE_OK" = "healthy" ] && [ "$PG_OK" = "healthy" ]; then
        echo -e "${GREEN}Services healthy${NC}"
        break
    fi
    echo -n "."
    sleep 5
    WAITED=$((WAITED + 5))
done
echo ""

if [ $WAITED -ge $MAX_WAIT ]; then
    echo -e "${YELLOW}Timeout waiting for services. Continuing anyway...${NC}"
fi

# Step 7: Run Alembic migrations
echo -e "\n${YELLOW}Running database migrations (Alembic)...${NC}"
BACKEND_CONTAINER=$(docker ps --format '{{.Names}}' | grep -E 'ciber-backend' | head -1)
if [ -n "$BACKEND_CONTAINER" ]; then
    docker exec "$BACKEND_CONTAINER" alembic upgrade head 2>&1 || {
        echo -e "${YELLOW}Alembic upgrade failed (may be already at head). Stamping...${NC}"
        docker exec "$BACKEND_CONTAINER" alembic stamp head 2>&1 || true
    }
else
    echo -e "${RED}Backend container not found!${NC}"
fi

# Step 8: Health check
echo -e "\n${YELLOW}Performing health checks...${NC}"

check_service() {
    local service_name=$1
    local health_url=$2
    echo -n "  Checking $service_name... "
    if curl -f -s "$health_url" > /dev/null 2>&1; then
        echo -e "${GREEN}OK${NC}"
        return 0
    else
        echo -e "${RED}FAILED${NC}"
        return 1
    fi
}

ALL_HEALTHY=true
check_service "Backend" "http://localhost:4000/health" || ALL_HEALTHY=false
check_service "Executor" "http://localhost:5000/health" || ALL_HEALTHY=false
check_service "Frontend" "http://localhost:3000" || ALL_HEALTHY=false

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "\n${GREEN}=========================================="
    echo "  Deployment successful!"
    echo -e "==========================================${NC}\n"
else
    echo -e "\n${YELLOW}=========================================="
    echo "  Deployment completed with warnings"
    echo "  Some health checks failed!"
    echo -e "==========================================${NC}\n"
fi

# Step 9: Show service status
echo -e "${YELLOW}Service Status:${NC}"
$COMPOSE -f "$COMPOSE_FILE" ps

exit 0
