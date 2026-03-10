#!/bin/bash
# Script de Validación Automática de Datos de Cursos
# Versión: 1.0
# Fecha: 2026-03-08

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Función para imprimir resultados
print_result() {
  local status=$1
  local message=$2

  if [ "$status" == "PASS" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $message"
    ((TESTS_PASSED++))
  elif [ "$status" == "FAIL" ]; then
    echo -e "${RED}❌ FAIL${NC}: $message"
    ((TESTS_FAILED++))
  elif [ "$status" == "WARN" ]; then
    echo -e "${YELLOW}⚠️  WARN${NC}: $message"
    ((TESTS_WARNING++))
  else
    echo -e "${BLUE}ℹ️  INFO${NC}: $message"
  fi
}

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔍 Validación de Datos de Cursos - Plataforma LMS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"

# Test 1: Docker services running
echo -e "\n${BLUE}━━━ Test 1: Servicios Docker ━━━${NC}"
if docker-compose ps | grep -E "ciber-backend.*Up" > /dev/null; then
  print_result "PASS" "Backend container running"
else
  print_result "FAIL" "Backend container NOT running"
fi

if docker-compose ps | grep -E "ciber-postgres.*Up" > /dev/null; then
  print_result "PASS" "PostgreSQL container running"
else
  print_result "FAIL" "PostgreSQL container NOT running"
fi

if docker-compose ps | grep -E "ciber-frontend.*Up" > /dev/null; then
  print_result "PASS" "Frontend container running"
else
  print_result "FAIL" "Frontend container NOT running"
fi

# Test 2: API Health Check
echo -e "\n${BLUE}━━━ Test 2: API Backend Health ━━━${NC}"
if curl -s -f http://localhost:4000/health > /dev/null 2>&1; then
  print_result "PASS" "API health endpoint responding"
else
  print_result "FAIL" "API health endpoint NOT responding"
fi

# Test 3: Courses endpoint
echo -e "\n${BLUE}━━━ Test 3: Courses API Endpoint ━━━${NC}"
COURSES_RESPONSE=$(curl -s http://localhost:4000/api/courses 2>/dev/null)
if echo "$COURSES_RESPONSE" | grep -q "success"; then
  print_result "PASS" "Courses API endpoint responding"

  # Check if courses array has data
  COURSE_COUNT=$(echo "$COURSES_RESPONSE" | jq -r '.data | length' 2>/dev/null)
  if [ "$COURSE_COUNT" -gt 0 ]; then
    print_result "PASS" "Found $COURSE_COUNT course(s) in API response"
  else
    print_result "FAIL" "No courses found in API response"
  fi
else
  print_result "FAIL" "Courses API endpoint error or invalid response"
fi

# Test 4: Price field validation
echo -e "\n${BLUE}━━━ Test 4: Course Price Field ━━━${NC}"
PRICE=$(echo "$COURSES_RESPONSE" | jq -r '.data[0].price' 2>/dev/null)
if [ "$PRICE" == "null" ]; then
  print_result "FAIL" "Price is NULL (will show as 'NaN US\$' in frontend)"
elif [ "$PRICE" == "" ]; then
  print_result "FAIL" "Price field missing"
else
  print_result "PASS" "Price is defined: $PRICE"
fi

# Test 5: Database - Course exists
echo -e "\n${BLUE}━━━ Test 5: Database - Course Record ━━━${NC}"
COURSE_DB_COUNT=$(docker exec ciber-postgres psql -U ciber_admin -d ciber_platform -t -c "SELECT COUNT(*) FROM courses WHERE slug = 'ciberseguridad-postcuantica';" 2>/dev/null | tr -d ' ')
if [ "$COURSE_DB_COUNT" -eq 1 ]; then
  print_result "PASS" "Course 'ciberseguridad-postcuantica' exists in database"
else
  print_result "FAIL" "Course NOT found in database (count: $COURSE_DB_COUNT)"
fi

# Test 6: Database - Price in DB
echo -e "\n${BLUE}━━━ Test 6: Database - Price Field ━━━${NC}"
PRICE_DB=$(docker exec ciber-postgres psql -U ciber_admin -d ciber_platform -t -c "SELECT price FROM courses WHERE slug = 'ciberseguridad-postcuantica';" 2>/dev/null | tr -d ' ')
if [ "$PRICE_DB" == "" ] || [ "$PRICE_DB" == "NULL" ]; then
  print_result "FAIL" "Price is NULL in database"
else
  print_result "PASS" "Price in database: $PRICE_DB"
fi

# Test 7: Database - Modules count
echo -e "\n${BLUE}━━━ Test 7: Database - Modules ━━━${NC}"
MODULES_COUNT=$(docker exec ciber-postgres psql -U ciber_admin -d ciber_platform -t -c "SELECT COUNT(*) FROM modules WHERE \"courseId\" IN (SELECT id FROM courses WHERE slug = 'ciberseguridad-postcuantica');" 2>/dev/null | tr -d ' ')
if [ "$MODULES_COUNT" -eq 9 ]; then
  print_result "PASS" "Found 9 modules (expected)"
elif [ "$MODULES_COUNT" -gt 0 ]; then
  print_result "WARN" "Found $MODULES_COUNT modules (expected 9)"
else
  print_result "FAIL" "No modules found"
fi

# Test 8: Database - Lessons count (CRITICAL)
echo -e "\n${BLUE}━━━ Test 8: Database - Lessons (CRITICAL) ━━━${NC}"
LESSONS_COUNT=$(docker exec ciber-postgres psql -U ciber_admin -d ciber_platform -t -c "SELECT COUNT(*) FROM lessons WHERE \"moduleId\" IN (SELECT id FROM modules WHERE \"courseId\" IN (SELECT id FROM courses WHERE slug = 'ciberseguridad-postcuantica'));" 2>/dev/null | tr -d ' ')
if [ "$LESSONS_COUNT" -gt 20 ]; then
  print_result "PASS" "Found $LESSONS_COUNT lessons (expected 30+)"
elif [ "$LESSONS_COUNT" -gt 0 ]; then
  print_result "WARN" "Found only $LESSONS_COUNT lessons (expected 30+)"
else
  print_result "FAIL" "No lessons found (modules will show '0 lecciones')"
fi

# Test 9: Lessons per module breakdown
echo -e "\n${BLUE}━━━ Test 9: Lessons per Module ━━━${NC}"
docker exec ciber-postgres psql -U ciber_admin -d ciber_platform -t -c "
SELECT
  m.\"order\" || '. ' || LEFT(m.title, 40) as modulo,
  COUNT(l.id) as lecciones
FROM modules m
LEFT JOIN lessons l ON l.\"moduleId\" = m.id
WHERE m.\"courseId\" IN (SELECT id FROM courses WHERE slug = 'ciberseguridad-postcuantica')
GROUP BY m.id, m.title, m.\"order\"
ORDER BY m.\"order\";
" 2>/dev/null | while read line; do
  LESSON_COUNT=$(echo "$line" | awk '{print $NF}')
  MODULE_NAME=$(echo "$line" | sed 's/|[^|]*$//')

  if [ "$LESSON_COUNT" -gt 0 ]; then
    echo -e "  ${GREEN}✓${NC} $line"
  else
    echo -e "  ${RED}✗${NC} $line ${RED}(0 lessons!)${NC}"
  fi
done

# Test 10: Frontend accessibility
echo -e "\n${BLUE}━━━ Test 10: Frontend Accessibility ━━━${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$FRONTEND_STATUS" == "200" ]; then
  print_result "PASS" "Frontend accessible (HTTP 200)"
else
  print_result "FAIL" "Frontend not accessible (HTTP $FRONTEND_STATUS)"
fi

COURSES_PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/courses 2>/dev/null)
if [ "$COURSES_PAGE_STATUS" == "200" ]; then
  print_result "PASS" "Courses catalog page accessible (HTTP 200)"
else
  print_result "FAIL" "Courses catalog NOT accessible (HTTP $COURSES_PAGE_STATUS)"
fi

# Test 11: CORS configuration
echo -e "\n${BLUE}━━━ Test 11: CORS Configuration ━━━${NC}"
CORS_HEADER=$(curl -s -H "Origin: http://localhost:3000" -I http://localhost:4000/api/courses 2>/dev/null | grep -i "access-control-allow-origin")
if echo "$CORS_HEADER" | grep -q "localhost:3000"; then
  print_result "PASS" "CORS configured correctly for localhost:3000"
else
  print_result "FAIL" "CORS not configured or incorrect"
fi

# Test 12: API Course detail endpoint
echo -e "\n${BLUE}━━━ Test 12: Course Detail Endpoint ━━━${NC}"
COURSE_DETAIL=$(curl -s http://localhost:4000/api/courses/ciberseguridad-postcuantica 2>/dev/null)
if echo "$COURSE_DETAIL" | jq -e '.data.modules | length' > /dev/null 2>&1; then
  MODULE_COUNT_API=$(echo "$COURSE_DETAIL" | jq -r '.data.modules | length')
  print_result "PASS" "Course detail endpoint returns $MODULE_COUNT_API modules"

  # Check lesson counts in modules
  ZERO_LESSON_MODULES=$(echo "$COURSE_DETAIL" | jq -r '.data.modules[] | select(._count.lessons == 0) | .title' 2>/dev/null)
  if [ -z "$ZERO_LESSON_MODULES" ]; then
    print_result "PASS" "All modules have lessons"
  else
    print_result "WARN" "Some modules have 0 lessons: $ZERO_LESSON_MODULES"
  fi
else
  print_result "FAIL" "Course detail endpoint error or invalid response"
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Passed:  $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed:  $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $TESTS_WARNING${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
echo -e "\n${BLUE}Total tests: $TOTAL_TESTS${NC}"

# Recommendations
echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📝 Recommendations${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"

if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${RED}❌ Critical issues found!${NC}"
  echo -e "\n${YELLOW}Suggested actions:${NC}"

  if [ "$PRICE_DB" == "" ] || [ "$PRICE_DB" == "NULL" ]; then
    echo -e "  1. Fix price field: Run seed script with corrected price"
    echo -e "     ${BLUE}docker exec ciber-backend npm run seed:curso${NC}"
  fi

  if [ "$LESSONS_COUNT" -eq 0 ]; then
    echo -e "  2. Import lessons: Ensure Markdown files exist and run seed"
    echo -e "     ${BLUE}ls ../01_Fundamentos_Ciberseguridad/teoria/*.md${NC}"
    echo -e "     ${BLUE}docker exec ciber-backend npm run seed:curso${NC}"
  fi

  if [ "$COURSE_DB_COUNT" -eq 0 ]; then
    echo -e "  3. Create course: Run seed script"
    echo -e "     ${BLUE}docker exec ciber-backend npm run seed:curso${NC}"
  fi

  echo -e "\n${YELLOW}Or perform complete reset:${NC}"
  echo -e "  ${BLUE}docker exec ciber-backend npx prisma migrate reset${NC}"

elif [ $TESTS_WARNING -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Some warnings found. System functional but not optimal.${NC}"
  echo -e "\n${YELLOW}Consider:${NC}"
  echo -e "  - Re-running seed to ensure all lessons imported"
  echo -e "  - Checking Markdown files in module folders"
else
  echo -e "${GREEN}✅ All tests passed! System is healthy.${NC}"
  echo -e "\n${GREEN}Course data is correctly loaded and ready for use.${NC}"
fi

# Exit with appropriate code
if [ $TESTS_FAILED -gt 0 ]; then
  echo -e "\n${RED}Validation FAILED${NC}"
  exit 1
elif [ $TESTS_WARNING -gt 0 ]; then
  echo -e "\n${YELLOW}Validation PASSED with warnings${NC}"
  exit 0
else
  echo -e "\n${GREEN}Validation PASSED${NC}"
  exit 0
fi
