#!/bin/bash
# ===========================================
# Database Restore Script
# ===========================================

set -e  # Exit on error

echo "=========================================="
echo "📥 Database Restore Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./database/backups}"
DB_HOST="${DB_HOST:-postgres}"
DB_NAME="${DB_NAME:-ciber_platform}"
DB_USER="${DB_USER:-ciber_admin}"

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lht "$BACKUP_DIR"/backup_*.sql* | head -10
    echo ""
    echo -e "${YELLOW}Usage: $0 <backup_file>${NC}"
    echo -e "${YELLOW}Example: $0 backup_20240101_120000.sql.gz${NC}"
    exit 1
fi

BACKUP_FILE=$1
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup file exists
if [ ! -f "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Backup file not found: ${BACKUP_PATH}${NC}"
    exit 1
fi

# Warning
echo -e "${RED}⚠️  WARNING: This will replace all current database data!${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"
echo -e "${YELLOW}Database: ${DB_NAME}${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/NO): " -r
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

# Create a backup of current database before restore
echo -e "\n${YELLOW}Creating safety backup of current database...${NC}"
./scripts/backup-db.sh || {
    echo -e "${RED}❌ Failed to create safety backup!${NC}"
    exit 1
}

# Decompress if needed
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "\n${YELLOW}Decompressing backup...${NC}"
    TEMP_FILE="${BACKUP_PATH%.gz}"
    gunzip -c "$BACKUP_PATH" > "$TEMP_FILE" || {
        echo -e "${RED}❌ Failed to decompress backup!${NC}"
        exit 1
    }
    BACKUP_PATH="$TEMP_FILE"
fi

# Stop services (optional)
echo -e "\n${YELLOW}Stopping backend services...${NC}"
docker-compose stop backend frontend executor || true

# Restore database
echo -e "\n${YELLOW}Restoring database...${NC}"
docker exec -i ciber-postgres psql \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    < "$BACKUP_PATH" || {
    echo -e "${RED}❌ Restore failed!${NC}"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
}

# Clean up temp file
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

# Restart services
echo -e "\n${YELLOW}Restarting services...${NC}"
docker-compose up -d

echo -e "\n${GREEN}=========================================="
echo "✅ Database restored successfully!"
echo -e "==========================================${NC}\n"

exit 0
