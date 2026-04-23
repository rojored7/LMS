#!/bin/bash
# ===========================================
# Validate Parity: Dev vs Prod Compose
# ===========================================
# Compares environment variables, services, and build args
# between docker-compose.yml and docker-compose.prod.yml.
# Run BEFORE deploying to catch discrepancies.
#
# Usage: ./scripts/validate-parity.sh
# ===========================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

echo ""
echo "=========================================="
echo "  Dev vs Prod Parity Check"
echo "=========================================="

DEV="docker-compose.yml"
PROD="docker-compose.prod.yml"

if [ ! -f "$DEV" ] || [ ! -f "$PROD" ]; then
    echo -e "${RED}Missing compose files${NC}"
    exit 1
fi

# --- Extract env var names from a compose file for a service ---
extract_env_vars() {
    local file=$1 service=$2
    grep -A200 "^  ${service}:" "$file" | \
        sed -n '/environment:/,/^  [a-z]/p' | \
        grep -E '^\s+\w+:' | \
        sed 's/:.*//' | tr -d ' ' | sort -u
}

# --- Compare env vars for a service ---
compare_service() {
    local service=$1
    local dev_vars=$(extract_env_vars "$DEV" "$service")
    local prod_vars=$(extract_env_vars "$PROD" "$service")

    local missing=""
    for var in $dev_vars; do
        if ! echo "$prod_vars" | grep -q "^${var}$"; then
            missing="${missing}  ${var}\n"
        fi
    done

    if [ -n "$missing" ]; then
        echo -e "${YELLOW}[${service}] Env vars in DEV but NOT in PROD:${NC}"
        echo -e "$missing"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "${GREEN}[${service}] Env vars: OK${NC}"
    fi
}

echo ""
echo "--- Environment Variables ---"
compare_service "backend"
compare_service "executor"
compare_service "frontend"

# --- Check Dockerfile build args vs compose ---
echo ""
echo "--- Frontend Build Args ---"
DOCKERFILE_ARGS=$(grep "^ARG VITE_" frontend/Dockerfile 2>/dev/null | sed 's/ARG //' | cut -d= -f1 | sort)
COMPOSE_ARGS=$(grep -A10 "args:" "$PROD" | grep "VITE_" | sed 's/:.*//' | tr -d ' ' | sort)

for arg in $DOCKERFILE_ARGS; do
    if ! echo "$COMPOSE_ARGS" | grep -q "$arg"; then
        echo -e "${YELLOW}  $arg: in Dockerfile but NOT passed by prod compose${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  All build args passed${NC}"
fi

# --- Check services ---
echo ""
echo "--- Services ---"
DEV_SERVICES=$(grep -E "^  [a-z].*:" "$DEV" | grep -v "#" | sed 's/://' | tr -d ' ' | sort)
PROD_SERVICES=$(grep -E "^  [a-z].*:" "$PROD" | grep -v "#" | sed 's/://' | tr -d ' ' | sort)

for svc in $DEV_SERVICES; do
    if ! echo "$PROD_SERVICES" | grep -q "^${svc}$"; then
        echo -e "${YELLOW}  $svc: in DEV but NOT in PROD${NC}"
    fi
done

# --- Summary ---
echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}  Parity check PASSED${NC}"
else
    echo -e "${YELLOW}  Found $ERRORS discrepancies${NC}"
fi
echo "=========================================="

exit $ERRORS
