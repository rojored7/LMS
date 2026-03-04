#!/bin/bash
# ===========================================
# Deployment Script for Ciber Platform
# ===========================================

set -e  # Exit on error

echo "=========================================="
echo "🚀 Starting deployment..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="${1:-docker-compose.yml}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"

echo -e "${YELLOW}Using compose file: ${COMPOSE_FILE}${NC}"

# Step 1: Pull latest changes (if in git repo)
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}📥 Pulling latest changes from git...${NC}"
    git pull origin $(git branch --show-current) || {
        echo -e "${RED}❌ Git pull failed. Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
else
    echo -e "${YELLOW}⚠️  Not a git repository, skipping git pull${NC}"
fi

# Step 2: Create backup before deployment
if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
    echo -e "\n${YELLOW}📦 Creating database backup...${NC}"
    ./scripts/backup-db.sh || {
        echo -e "${RED}❌ Backup failed. Continue anyway? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
fi

# Step 3: Build images
echo -e "\n${YELLOW}🔨 Building Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" build --no-cache || {
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
}

# Step 4: Run migrations
echo -e "\n${YELLOW}🗄️  Running database migrations...${NC}"
docker-compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy || {
    echo -e "${RED}❌ Migration failed!${NC}"
    exit 1
}

# Step 5: Generate Prisma client
echo -e "\n${YELLOW}🔧 Generating Prisma client...${NC}"
docker-compose -f "$COMPOSE_FILE" run --rm backend npx prisma generate || {
    echo -e "${RED}❌ Prisma client generation failed!${NC}"
    exit 1
}

# Step 6: Restart services
echo -e "\n${YELLOW}🔄 Restarting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d || {
    echo -e "${RED}❌ Service restart failed!${NC}"
    exit 1
}

# Step 7: Wait for services to be healthy
echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
sleep 10

# Step 8: Health check
echo -e "\n${YELLOW}🏥 Performing health checks...${NC}"

check_service() {
    local service_name=$1
    local health_url=$2
    echo -n "  Checking $service_name... "

    if curl -f -s "$health_url" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

ALL_HEALTHY=true
check_service "Backend" "http://localhost:4000/health" || ALL_HEALTHY=false
check_service "Executor" "http://localhost:5000/health" || ALL_HEALTHY=false
check_service "Frontend" "http://localhost:3000" || ALL_HEALTHY=false

if [ "$ALL_HEALTHY" = true ]; then
    echo -e "\n${GREEN}=========================================="
    echo "✅ Deployment successful!"
    echo -e "==========================================${NC}\n"
else
    echo -e "\n${RED}=========================================="
    echo "⚠️  Deployment completed with warnings"
    echo "Some health checks failed!"
    echo -e "==========================================${NC}\n"
fi

# Step 9: Show service status
echo -e "${YELLOW}Service Status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Step 10: Show recent logs
echo -e "\n${YELLOW}Recent logs (last 20 lines):${NC}"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

exit 0
