#!/bin/bash

# NEXUS PROTOCOL - Integration Testing Script
# Tests full stack integration and API endpoints
# Version: 1.0.0
# Last Updated: December 20, 2025

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_success() { echo -e "${GREEN}[PASS]${NC} $1"; }
log_error() { echo -e "${RED}[FAIL]${NC} $1"; }

API_URL="${API_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           NEXUS PROTOCOL INTEGRATION TESTS                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    log_info "Running: $test_name"
    
    if eval "$test_command"; then
        log_success "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Backend Health Check
run_test "Backend Health Check" "curl -f -s $API_URL/health > /dev/null"

# Test 2: Frontend Accessibility
run_test "Frontend Accessibility" "curl -f -s $FRONTEND_URL > /dev/null"

# Test 3: Authentication - Login
log_info "Testing authentication flow..."
TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"teamName":"Ghost","accessCode":"1234"}' \
    | grep -o '"sessionToken":"[^"]*"' \
    | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    log_success "Authentication - Login successful"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "Authentication - Login failed"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 4: Token Validation
if [ -n "$TOKEN" ]; then
    run_test "Token Validation" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/v1/auth/validate > /dev/null"
fi

# Test 5: Get Game State
if [ -n "$TOKEN" ]; then
    run_test "Get Game State" "curl -f -s -H 'Authorization: Bearer $TOKEN' $API_URL/api/v1/game/state > /dev/null"
fi

# Test 6: Get Missions
run_test "Get Missions List" "curl -f -s $API_URL/api/v1/missions > /dev/null"

# Test 7: Get Agents
run_test "Get Agents List" "curl -f -s $API_URL/api/v1/agents > /dev/null"

# Test 8: Select Agent
if [ -n "$TOKEN" ]; then
    run_test "Select Agent" "curl -f -s -X POST $API_URL/api/v1/agents/select \
        -H 'Authorization: Bearer $TOKEN' \
        -H 'Content-Type: application/json' \
        -d '{\"agentId\":\"hacker\"}' > /dev/null"
fi

# Test 9: Start Mission
if [ -n "$TOKEN" ]; then
    MISSION_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/missions/start" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"missionId":"FALSE_FLAG","selectedAgent":"hacker"}')
    
    MISSION_ID=$(echo "$MISSION_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$MISSION_ID" ]; then
        log_success "Start Mission"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "Start Mission"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    TESTS_RUN=$((TESTS_RUN + 1))
fi

# Test 10: WebSocket Connection
log_info "Testing WebSocket connection..."
if command -v wscat &> /dev/null; then
    timeout 5 wscat -c "ws://localhost:3000/socket.io/?EIO=4&transport=websocket" > /dev/null 2>&1
    if [ $? -eq 124 ]; then
        log_success "WebSocket Connection (timeout = success)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log_error "WebSocket Connection"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    log_info "WebSocket test skipped (wscat not installed)"
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 11: Rate Limiting
log_info "Testing rate limiting..."
RATE_LIMIT_FAILED=0
for i in {1..10}; do
    curl -s -X POST "$API_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"teamName":"Test","accessCode":"wrong"}' > /dev/null
done

# 11th request should be rate limited
RATE_LIMIT_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"teamName":"Test","accessCode":"wrong"}')

if echo "$RATE_LIMIT_RESPONSE" | grep -q "429"; then
    log_success "Rate Limiting Working"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "Rate Limiting Not Working"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 12: CORS Headers
log_info "Testing CORS headers..."
CORS_RESPONSE=$(curl -s -I -H "Origin: http://localhost:5173" "$API_URL/health")
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    log_success "CORS Headers Present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "CORS Headers Missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 13: Security Headers
log_info "Testing security headers..."
SECURITY_RESPONSE=$(curl -s -I "$API_URL/health")
SECURITY_PASS=true

if ! echo "$SECURITY_RESPONSE" | grep -q "X-Frame-Options"; then
    SECURITY_PASS=false
fi
if ! echo "$SECURITY_RESPONSE" | grep -q "X-Content-Type-Options"; then
    SECURITY_PASS=false
fi

if [ "$SECURITY_PASS" = true ]; then
    log_success "Security Headers Present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "Security Headers Missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 14: Database Connection
log_info "Testing database connection..."
DB_HEALTH=$(curl -s "$API_URL/health" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$DB_HEALTH" = "healthy" ] || [ "$DB_HEALTH" = "operational" ]; then
    log_success "Database Connection"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "Database Connection"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Test 15: Frontend Build Artifacts
log_info "Testing frontend build artifacts..."
if [ -f "frontend/dist/index.html" ] && [ -d "frontend/dist/assets" ]; then
    log_success "Frontend Build Artifacts Present"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "Frontend Build Artifacts Missing"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_RUN=$((TESTS_RUN + 1))

# Summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    TEST SUMMARY                               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Total Tests:  ${BLUE}$TESTS_RUN${NC}"
echo -e "Passed:       ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed:       ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed! System is ready for production.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review and fix issues before deployment.${NC}"
    exit 1
fi