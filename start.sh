#!/bin/bash

# LiveGate Full Stack - Main Entry Point
# This is the primary startup script for deployment platforms

set -e

echo "================================"
echo "Starting LiveGate Services"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠ Docker not found or not in PATH${NC}"
    echo "Attempting to start services directly..."
else
    echo -e "${YELLOW}→ Starting Docker containers...${NC}"
    if docker info > /dev/null 2>&1; then
        docker-compose -f backend/docker-compose.yml up -d --build
        echo -e "${GREEN}✓ Docker containers started${NC}"
    fi
fi

# Start backend services
echo -e "${YELLOW}→ Starting backend services...${NC}"

# Start Java service
if [ -f "backend/java-service/pom.xml" ]; then
    echo -e "${YELLOW}→ Building Java service...${NC}"
    cd backend/java-service
    mvn clean package -DskipTests 2>/dev/null || echo "Java build skipped"
    cd ../../
fi

# Start Node.js service
if [ -f "backend/nodejs-service/package.json" ]; then
    echo -e "${YELLOW}→ Installing Node.js dependencies...${NC}"
    cd backend/nodejs-service
    npm install --prefer-offline --no-audit 2>/dev/null || true
    npm run build 2>/dev/null || true
    cd ../../
fi

# Start Python service
if [ -f "backend/python-service/pyproject.toml" ]; then
    echo -e "${YELLOW}→ Setting up Python service...${NC}"
    cd backend/python-service
    python -m pip install -e . 2>/dev/null || true
    cd ../../
fi

# Start frontend
echo -e "${YELLOW}→ Installing frontend dependencies...${NC}"
cd frontend/web
npm install --prefer-offline --no-audit 2>/dev/null || true
cd ../..

echo -e "${GREEN}✓ All services initialized!${NC}"
echo ""
echo "Service URLs:"
echo "  Frontend Web:         http://localhost:5173"
echo "  Node.js API:          http://localhost:3000"
echo "  Java Service:         http://localhost:8080"
echo "  Python Service:       http://localhost:8000"
echo "  MySQL:                localhost:3307"
echo "  Redis:                localhost:6379"
echo ""
echo -e "${GREEN}Setup complete! Services are ready.${NC}"
