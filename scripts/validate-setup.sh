#!/bin/bash

# RentFix Setup Validation Script
# This script validates that your development environment is properly configured

set -e

echo "=================================================="
echo "🔍 RentFix Platform Setup Validation"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print success
success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print failure
failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

echo "1. Checking System Requirements..."
echo "-----------------------------------"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_NODE="18.0.0"
    if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
        success "Node.js version: v$NODE_VERSION (>= v18.0.0 required)"
    else
        failure "Node.js version: v$NODE_VERSION (>= v18.0.0 required)"
    fi
else
    failure "Node.js not found. Please install Node.js >= 18.0.0"
fi

# Check npm version
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    success "npm version: $NPM_VERSION"
else
    failure "npm not found. Please install npm"
fi

# Check Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    success "Docker version: $DOCKER_VERSION"
else
    failure "Docker not found. Please install Docker"
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f4 | cut -d',' -f1)
    success "Docker Compose version: $COMPOSE_VERSION"
else
    warning "Docker Compose not found (optional, but recommended)"
fi

echo ""
echo "2. Checking Project Dependencies..."
echo "-----------------------------------"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    success "node_modules directory exists"
else
    failure "node_modules not found. Run: npm install"
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
    success "package-lock.json exists"
else
    warning "package-lock.json not found"
fi

echo ""
echo "3. Checking Database Services..."
echo "-----------------------------------"

# Check if PostgreSQL container is running
if docker ps | grep -q "rentfix-postgres"; then
    success "PostgreSQL container is running"

    # Test PostgreSQL connection
    if docker exec rentfix-postgres-dev psql -U rentfix -d rentfix -c "SELECT 1" &> /dev/null; then
        success "PostgreSQL connection successful"

        # Check PostGIS extension
        if docker exec rentfix-postgres-dev psql -U rentfix -d rentfix -c "SELECT PostGIS_version()" &> /dev/null; then
            POSTGIS_VERSION=$(docker exec rentfix-postgres-dev psql -U rentfix -d rentfix -t -c "SELECT PostGIS_version()" | xargs)
            success "PostGIS extension enabled: $POSTGIS_VERSION"
        else
            failure "PostGIS extension not enabled. Run: CREATE EXTENSION IF NOT EXISTS postgis;"
        fi
    else
        failure "Cannot connect to PostgreSQL"
    fi
else
    failure "PostgreSQL container not running. Start with: docker-compose -f docker-compose.dev.yml up -d postgres"
fi

# Check if Redis container is running
if docker ps | grep -q "rentfix-redis"; then
    success "Redis container is running"

    # Test Redis connection
    if docker exec rentfix-redis-dev redis-cli ping &> /dev/null; then
        success "Redis connection successful"
    else
        failure "Cannot connect to Redis"
    fi
else
    failure "Redis container not running. Start with: docker-compose -f docker-compose.dev.yml up -d redis"
fi

echo ""
echo "4. Checking Environment Configuration..."
echo "-----------------------------------"

# Check if .env file exists
if [ -f ".env" ]; then
    success ".env file exists"

    # Check for required environment variables
    REQUIRED_VARS=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "REFRESH_TOKEN_SECRET")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "^${var}=" .env; then
            success "$var is configured"
        else
            warning "$var not found in .env file"
        fi
    done
else
    failure ".env file not found. Copy from .env.example"
fi

echo ""
echo "5. Checking Docker Compose Configuration..."
echo "-----------------------------------"

if [ -f "docker-compose.dev.yml" ]; then
    success "docker-compose.dev.yml exists"
else
    warning "docker-compose.dev.yml not found (optional for development)"
fi

if [ -f "docker-compose.prod.yml" ]; then
    success "docker-compose.prod.yml exists"
else
    warning "docker-compose.prod.yml not found"
fi

echo ""
echo "6. Checking Service Directories..."
echo "-----------------------------------"

SERVICES=(
    "services/api-gateway"
    "services/core-auth"
    "services/core-tickets"
    "services/core-matching"
    "services/core-properties"
)

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ]; then
        if [ -f "$service/package.json" ]; then
            success "$service configured"
        else
            warning "$service missing package.json"
        fi
    else
        failure "$service directory not found"
    fi
done

echo ""
echo "7. Checking Mobile Apps..."
echo "-----------------------------------"

APPS=("apps/mobile-tenant" "apps/mobile-contractor" "apps/web-agent")

for app in "${APPS[@]}"; do
    if [ -d "$app" ]; then
        if [ -f "$app/package.json" ]; then
            success "$app configured"
        else
            warning "$app missing package.json"
        fi
    else
        failure "$app directory not found"
    fi
done

echo ""
echo "=================================================="
echo "📊 Validation Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start backend services: cd services/api-gateway && npm run dev"
    echo "2. Start mobile app: cd apps/mobile-tenant && npx expo start"
    echo "3. Run tests: npm run test --workspaces"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please fix the issues above.${NC}"
    exit 1
fi
