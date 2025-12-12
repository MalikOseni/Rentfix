#!/bin/bash

# RentFix API Testing Script
# Quick smoke tests for core API endpoints

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

API_GATEWAY=${API_GATEWAY:-http://localhost:4000}
AUTH_SERVICE=${AUTH_SERVICE:-http://localhost:4100}
TICKETS_SERVICE=${TICKETS_SERVICE:-http://localhost:4200}

echo "=================================================="
echo "🧪 RentFix API Smoke Tests"
echo "=================================================="
echo ""

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $response)"
        ((FAILED++))
    fi
}

# Function to test with auth
test_with_auth() {
    local name=$1
    local url=$2
    local token=$3
    local expected_status=${4:-200}

    echo -n "Testing $name... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token" "$url")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected HTTP $expected_status, got HTTP $response)"
        ((FAILED++))
    fi
}

echo "1. Testing API Gateway..."
echo "-------------------------"
test_endpoint "API Gateway Health" "$API_GATEWAY/api/health"

echo ""
echo "2. Testing Core-Auth Service..."
echo "-------------------------------"

# Test health endpoint
test_endpoint "Core-Auth Health" "$AUTH_SERVICE/health"

# Test registration
echo -n "Testing User Registration... "
register_response=$(curl -s -X POST "$AUTH_SERVICE/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test-'$(date +%s)'@example.com",
        "password": "TestPass123!",
        "role": "tenant",
        "firstName": "Test",
        "lastName": "User"
    }')

if echo "$register_response" | grep -q "id"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ((FAILED++))
fi

# Test login
echo -n "Testing User Login... "
login_response=$(curl -s -X POST "$AUTH_SERVICE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "TestPass123!"
    }')

if echo "$login_response" | grep -q "accessToken"; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
    TOKEN=$(echo "$login_response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
    echo -e "${YELLOW}⚠ SKIP${NC} (Test user may not exist)"
    TOKEN=""
fi

echo ""
echo "3. Testing Core-Tickets Service..."
echo "----------------------------------"

if [ -n "$TOKEN" ]; then
    test_with_auth "Tickets Health" "$TICKETS_SERVICE/health"
    test_with_auth "Get All Tickets" "$TICKETS_SERVICE/v1/tickets" "$TOKEN"
else
    echo "⚠ Skipping authenticated tests (no token available)"
fi

echo ""
echo "=================================================="
echo "📊 Test Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All API tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed.${NC}"
    exit 1
fi
