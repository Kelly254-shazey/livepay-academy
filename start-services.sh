#!/bin/bash

# LiveGate Full Stack Startup Script
# This script starts all services in the correct order

set -e

echo "================================"
echo "Starting LiveGate Services"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
fi

echo -e "${YELLOW}→ Starting Docker containers...${NC}"
docker-compose -f backend/docker-compose.yml up -d --build

echo -e "${YELLOW}→ Waiting for MySQL to be healthy...${NC}"
docker-compose -f backend/docker-compose.yml exec -T mysql mysqladmin ping -h 127.0.0.1 --silent

echo -e "${YELLOW}→ Waiting for Redis to be ready...${NC}"
sleep 3

echo -e "${YELLOW}→ Running Node.js Prisma migrations...${NC}"
docker-compose -f backend/docker-compose.yml exec -T nodejs-service npm run prisma:migrate:deploy

echo -e "${GREEN}✓ All backend services are running!${NC}"
echo ""
echo "Service URLs:"
echo "  Frontend Web:         http://localhost:5173"
echo "  Frontend Mobile:      Use Expo Go with QR code"
echo "  Node.js API:          http://localhost:3000"
echo "  Swagger Docs:         http://localhost:3000/docs"
echo "  Python Service:       http://localhost:8000"
echo "  Java Service:         http://localhost:8080"
echo "  MySQL:                localhost:3306"
echo "  Redis:                localhost:6379"
echo ""
echo -e "${YELLOW}→ Next steps:${NC}"
echo "  1. frontend/web > npm install && npm run dev"
echo "  2. frontend/mobile > npm install && npx expo start"
echo "  3. Open http://localhost:5173 in your browser"
