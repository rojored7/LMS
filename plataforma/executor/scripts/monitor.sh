#!/bin/bash

# Script to monitor the Executor service
# Usage: ./scripts/monitor.sh [interval_seconds]

INTERVAL=${1:-5}
HOST=${2:-localhost}
PORT=${3:-5000}

echo "Monitoring Executor service at http://${HOST}:${PORT}"
echo "Update interval: ${INTERVAL} seconds"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  clear
  echo "=== Executor Service Monitor ==="
  echo "Time: $(date)"
  echo ""

  # Health check
  echo "--- Health Status ---"
  health=$(curl -s "http://${HOST}:${PORT}/health" 2>/dev/null)
  if [ $? -eq 0 ]; then
    echo "$health" | jq '.' 2>/dev/null || echo "$health"
  else
    echo "ERROR: Cannot connect to service"
  fi
  echo ""

  # Docker containers
  echo "--- Docker Containers ---"
  docker ps --filter "ancestor=ciber-sandbox:latest" --format "table {{.ID}}\t{{.Status}}\t{{.RunningFor}}" 2>/dev/null || echo "No containers found"
  echo ""

  # System resources
  echo "--- System Resources ---"
  echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
  echo "Memory: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
  echo "Docker Disk: $(docker system df --format "{{.Size}}" 2>/dev/null | head -n1)"
  echo ""

  sleep $INTERVAL
done
