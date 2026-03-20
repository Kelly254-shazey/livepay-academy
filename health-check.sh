#!/bin/bash

# LiveGate Services Health Check Script
# This script validates all services are properly configured

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  LiveGate Services - Health Check Script${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Counter for passed/failed checks
PASSED=0
FAILED=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check environment files exist
echo -e "${YELLOW}→ Checking Environment Files...${NC}"

if [ -f backend/nodejs-service/.env ]; then
    check_pass "backend/nodejs-service/.env exists"
else
    check_fail "backend/nodejs-service/.env missing"
fi

if [ -f backend/python-service/.env ]; then
    check_pass "backend/python-service/.env exists"
else
    check_fail "backend/python-service/.env missing"
fi

if [ -f backend/java-service/.env ]; then
    check_pass "backend/java-service/.env exists"
else
    check_fail "backend/java-service/.env missing"
fi

if [ -f frontend/web/.env ]; then
    check_pass "frontend/web/.env exists"
else
    check_fail "frontend/web/.env missing"
fi

if [ -f frontend/mobile/.env ]; then
    check_pass "frontend/mobile/.env exists"
else
    check_fail "frontend/mobile/.env missing"
fi

echo ""

# 2. Check environment variables
echo -e "${YELLOW}→ Checking Environment Variables...${NC}"

# Load Node.js env
if [ -f backend/nodejs-service/.env ]; then
    source backend/nodejs-service/.env
    
    [ -n "$NODE_ENV" ] && check_pass "NODE_ENV set" || check_fail "NODE_ENV not set"
    [ -n "$PORT" ] && check_pass "PORT set" || check_fail "PORT not set"
    [ -n "$DATABASE_URL" ] && check_pass "DATABASE_URL set" || check_fail "DATABASE_URL not set"
    [ -n "$REDIS_URL" ] && check_pass "REDIS_URL set" || check_fail "REDIS_URL not set"
    [ -n "$JWT_ACCESS_SECRET" ] && check_pass "JWT_ACCESS_SECRET set" || check_fail "JWT_ACCESS_SECRET not set"
    [ -n "$JWT_REFRESH_SECRET" ] && check_pass "JWT_REFRESH_SECRET set" || check_fail "JWT_REFRESH_SECRET not set"
    [ -n "$INTERNAL_API_KEY" ] && check_pass "INTERNAL_API_KEY set" || check_fail "INTERNAL_API_KEY not set"
    [ -n "$JAVA_FINANCE_URL" ] && check_pass "JAVA_FINANCE_URL set" || check_fail "JAVA_FINANCE_URL not set"
    [ -n "$PYTHON_INTELLIGENCE_URL" ] && check_pass "PYTHON_INTELLIGENCE_URL set" || check_fail "PYTHON_INTELLIGENCE_URL not set"
fi

echo ""

# 3. Check Docker
echo -e "${YELLOW}→ Checking Docker...${NC}"

if command -v docker &> /dev/null; then
    check_pass "Docker is installed"
    
    if docker info > /dev/null 2>&1; then
        check_pass "Docker daemon is running"
    else
        check_warn "Docker daemon is not running (required for backend)"
    fi
else
    check_fail "Docker is not installed"
fi

echo ""

# 4. Check Node.js
echo -e "${YELLOW}→ Checking Node.js...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js is installed ($NODE_VERSION)"
else
    check_fail "Node.js is not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    check_pass "npm is installed ($NPM_VERSION)"
else
    check_fail "npm is not installed"
fi

echo ""

# 5. Check Python
echo -e "${YELLOW}→ Checking Python...${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    check_pass "Python 3 is installed ($PYTHON_VERSION)"
else
    check_warn "Python 3 is not installed (needed for Python service development)"
fi

echo ""

# 6. Check Java
echo -e "${YELLOW}→ Checking Java...${NC}"

if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -n 1)
    check_pass "Java is installed ($JAVA_VERSION)"
else
    check_warn "Java is not installed (needed for Java service development)"
fi

if command -v mvn &> /dev/null; then
    check_pass "Maven is installed"
else
    check_warn "Maven is not installed (needed for Java service development)"
fi

echo ""

# 7. Check database files
echo -e "${YELLOW}→ Checking Database Setup Files...${NC}"

if [ -f backend/mysql/init/01-databases.sql ]; then
    check_pass "Database initialization script exists"
else
    check_fail "Database initialization script missing"
fi

if [ -d backend/nodejs-service/prisma/migrations ]; then
    check_pass "Prisma migrations directory exists"
else
    check_fail "Prisma migrations directory missing"
fi

echo ""

# 8. Check frontend dependencies
echo -e "${YELLOW}→ Checking Frontend Setup...${NC}"

if [ -f frontend/web/package.json ]; then
    check_pass "Web frontend package.json exists"
else
    check_fail "Web frontend package.json missing"
fi

if [ -f frontend/mobile/package.json ]; then
    check_pass "Mobile frontend package.json exists"
else
    check_fail "Mobile frontend package.json missing"
fi

if [ -f frontend/shared/package.json ]; then
    check_pass "Shared package.json exists"
else
    check_fail "Shared package.json missing"
fi

echo ""

# 9. Check backend dependencies
echo -e "${YELLOW}→ Checking Backend Setup...${NC}"

if [ -f backend/nodejs-service/package.json ]; then
    check_pass "Node.js service package.json exists"
else
    check_fail "Node.js service package.json missing"
fi

if [ -f backend/python-service/pyproject.toml ]; then
    check_pass "Python service pyproject.toml exists"
else
    check_fail "Python service pyproject.toml missing"
fi

if [ -f backend/java-service/pom.xml ]; then
    check_pass "Java service pom.xml exists"
else
    check_fail "Java service pom.xml missing"
fi

echo ""

# 10. Check startup scripts
echo -e "${YELLOW}→ Checking Startup Scripts...${NC}"

if [ -f start-services.sh ]; then
    check_pass "start-services.sh exists"
else
    check_warn "start-services.sh not found"
fi

if [ -f start-services.bat ]; then
    check_pass "start-services.bat exists"
else
    check_warn "start-services.bat not found"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Services are ready to start.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./start-services.sh (Linux/Mac) or start-services.bat (Windows)"
    echo "  2. Wait for all containers to be healthy"
    echo "  3. Run: cd frontend/web && npm install && npm run dev"
    echo "  4. Visit: http://localhost:5173"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  • Install Docker: https://docs.docker.com/get-docker/"
    echo "  • Install Node.js: https://nodejs.org/"
    echo "  • Create missing .env files from examples"
    echo "  • Run: npm install in service directories"
    exit 1
fi
