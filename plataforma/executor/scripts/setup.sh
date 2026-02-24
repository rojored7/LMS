#!/bin/bash

# Setup script for Executor service
# Usage: ./scripts/setup.sh

set -e

echo "Setting up Executor service..."
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed"
  exit 1
fi
echo "Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
  echo "ERROR: npm is not installed"
  exit 1
fi
echo "npm: $(npm --version)"

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "ERROR: Docker is not installed"
  exit 1
fi
echo "Docker: $(docker --version)"

# Check Docker is running
if ! docker ps &> /dev/null; then
  echo "ERROR: Docker is not running"
  exit 1
fi
echo "Docker is running"

# Check Redis (optional)
if command -v redis-cli &> /dev/null; then
  echo "Redis: $(redis-cli --version)"
else
  echo "Redis: Not installed (will use Docker Compose)"
fi

echo ""

# Install dependencies
echo "Installing dependencies..."
npm install

echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "Please edit .env file with your configuration"
fi

echo ""

# Build TypeScript
echo "Building TypeScript..."
npm run build

echo ""

# Build sandbox image
echo "Building sandbox Docker image..."
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .

echo ""

# Create logs directory
mkdir -p logs

echo ""

# Test sandbox image
echo "Testing sandbox image..."
docker run --rm ciber-sandbox:latest python3 -c "print('Python OK')"
docker run --rm ciber-sandbox:latest node -e "console.log('Node OK')"
docker run --rm ciber-sandbox:latest bash -c "echo 'Bash OK'"

echo ""
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env file if needed"
echo "2. Start services with: docker-compose up -d"
echo "3. Or run locally with: npm run dev"
echo "4. Test API with: ./scripts/test-api.sh"
