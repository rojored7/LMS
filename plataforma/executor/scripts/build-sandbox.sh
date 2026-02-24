#!/bin/bash

# Script to build the sandbox Docker image
# Usage: ./scripts/build-sandbox.sh

set -e

echo "Building sandbox Docker image..."

docker build \
  -f Dockerfile.sandbox \
  -t ciber-sandbox:latest \
  .

echo "Sandbox image built successfully!"
echo ""
echo "Verifying image..."
docker images | grep ciber-sandbox

echo ""
echo "Testing image..."
docker run --rm ciber-sandbox:latest python3 --version
docker run --rm ciber-sandbox:latest node --version
docker run --rm ciber-sandbox:latest bash --version

echo ""
echo "All tests passed! Sandbox is ready to use."
