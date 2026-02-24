#!/bin/bash

# Script to cleanup Docker containers and resources
# Usage: ./scripts/cleanup.sh

set -e

echo "Cleaning up Docker resources..."

# Stop and remove all containers with ciber-sandbox image
echo "Stopping containers..."
docker ps -a | grep ciber-sandbox | awk '{print $1}' | xargs -r docker stop 2>/dev/null || true

echo "Removing containers..."
docker ps -a | grep ciber-sandbox | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

# Remove dangling images
echo "Removing dangling images..."
docker image prune -f

# Show remaining containers
echo ""
echo "Remaining containers:"
docker ps -a

echo ""
echo "Cleanup completed!"
