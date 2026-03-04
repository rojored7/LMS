#!/bin/bash
# ===========================================
# Database Backup Script
# ===========================================

set -e  # Exit on error

echo "=========================================="
echo "📦 Creating database backup..."
echo "=========================================="

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-./database/backups}"
BACKUP_FILE="backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
KEEP_BACKUPS="${KEEP_BACKUPS:-7}"  # Keep last 7 backups by default

# Database connection info (from .env or defaults)
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ciber_platform}"
DB_USER="${DB_USER:-ciber_admin}"
DB_PASSWORD="${DB_PASSWORD:-changeme123}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Backup directory: ${BACKUP_DIR}${NC}"
echo -e "${YELLOW}Backup file: ${BACKUP_FILE}${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    exit 1
fi

# Check if postgres container is running
if ! docker ps --format '{{.Names}}' | grep -q "ciber-postgres"; then
    echo -e "${RED}❌ PostgreSQL container is not running!${NC}"
    exit 1
fi

# Create backup using pg_dump through Docker
echo -e "\n${YELLOW}Creating backup...${NC}"
docker exec -t ciber-postgres pg_dump \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --no-password \
    --clean \
    --if-exists \
    > "$BACKUP_PATH" 2>/dev/null || {
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
}

# Verify backup was created and is not empty
if [ ! -s "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Backup file is empty!${NC}"
    exit 1
fi

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

echo -e "${GREEN}✅ Backup created successfully!${NC}"
echo -e "   File: ${BACKUP_FILE}"
echo -e "   Size: ${BACKUP_SIZE}"
echo -e "   Path: ${BACKUP_PATH}"

# Compress backup
echo -e "\n${YELLOW}Compressing backup...${NC}"
gzip -f "$BACKUP_PATH" || {
    echo -e "${YELLOW}⚠️  Compression failed, keeping uncompressed backup${NC}"
    COMPRESSED_SIZE=$BACKUP_SIZE
}

if [ -f "${BACKUP_PATH}.gz" ]; then
    COMPRESSED_SIZE=$(du -h "${BACKUP_PATH}.gz" | cut -f1)
    echo -e "${GREEN}✅ Backup compressed${NC}"
    echo -e "   Compressed size: ${COMPRESSED_SIZE}"
    BACKUP_FILE="${BACKUP_FILE}.gz"
fi

# Clean up old backups
echo -e "\n${YELLOW}Cleaning up old backups (keeping last ${KEEP_BACKUPS})...${NC}"
cd "$BACKUP_DIR"
ls -t backup_*.sql* | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
REMAINING=$(ls -1 backup_*.sql* 2>/dev/null | wc -l)
echo -e "${GREEN}✅ Cleanup complete (${REMAINING} backups remaining)${NC}"

echo -e "\n${GREEN}=========================================="
echo "✅ Backup process completed successfully!"
echo -e "==========================================${NC}\n"

exit 0
