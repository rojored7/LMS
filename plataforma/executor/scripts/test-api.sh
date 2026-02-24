#!/bin/bash

# Script to test the Executor API
# Usage: ./scripts/test-api.sh [host] [port]

HOST=${1:-localhost}
PORT=${2:-5000}
BASE_URL="http://${HOST}:${PORT}"
USER_ID="test-user-$(date +%s)"

echo "Testing Executor API at ${BASE_URL}"
echo "Using User-ID: ${USER_ID}"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  local expected_status=$5

  echo -n "Testing ${name}... "

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
  else
    response=$(curl -s -w "\n%{http_code}" \
      -X "${method}" \
      -H "Content-Type: application/json" \
      -H "X-User-Id: ${USER_ID}" \
      -d "${data}" \
      "${BASE_URL}${endpoint}")
  fi

  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)

  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}PASSED${NC} (Status: ${status_code})"
    PASSED=$((PASSED + 1))

    # Pretty print response
    if command -v jq &> /dev/null; then
      echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
      echo "$body"
    fi
  else
    echo -e "${RED}FAILED${NC} (Expected: ${expected_status}, Got: ${status_code})"
    FAILED=$((FAILED + 1))
    echo "Response: $body"
  fi
  echo ""
}

# Test 1: Health Check
test_endpoint "Health Check" "GET" "/health" "" "200"

# Test 2: Supported Languages
test_endpoint "Supported Languages" "GET" "/languages" "" "200"

# Test 3: Python Execution
test_endpoint "Python Hello World" "POST" "/execute" \
  '{"code":"print(\"Hello from Python!\")","language":"python"}' \
  "200"

# Test 4: JavaScript Execution
test_endpoint "JavaScript Console Log" "POST" "/execute" \
  '{"code":"console.log(\"Hello from JavaScript!\")","language":"javascript"}' \
  "200"

# Test 5: Bash Execution
test_endpoint "Bash Echo" "POST" "/execute" \
  '{"code":"echo \"Hello from Bash!\"","language":"bash"}' \
  "200"

# Test 6: Python with Tests (Passing)
test_endpoint "Python with Passing Test" "POST" "/execute" \
  '{"code":"print(42)","language":"python","tests":[{"expectedOutput":"42","type":"exact"}]}' \
  "200"

# Test 7: Python with Tests (Failing)
test_endpoint "Python with Failing Test" "POST" "/execute" \
  '{"code":"print(41)","language":"python","tests":[{"expectedOutput":"42","type":"exact"}]}' \
  "200"

# Test 8: Invalid Language
test_endpoint "Invalid Language" "POST" "/execute" \
  '{"code":"test","language":"ruby"}' \
  "400"

# Test 9: Missing Code
test_endpoint "Missing Code" "POST" "/execute" \
  '{"language":"python"}' \
  "400"

# Test 10: Invalid Endpoint
test_endpoint "404 Not Found" "GET" "/invalid" "" "404"

# Summary
echo "=========================="
echo "Test Summary"
echo "=========================="
echo -e "Passed: ${GREEN}${PASSED}${NC}"
echo -e "Failed: ${RED}${FAILED}${NC}"
echo "=========================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}Some tests failed!${NC}"
  exit 1
fi
