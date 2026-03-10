#!/bin/bash

###############################################################################
# Script de Validación de Endpoints Backend
# Plataforma Multi-Curso de Ciberseguridad
#
# Uso: ./test-endpoints.sh [API_URL]
# Ejemplo: ./test-endpoints.sh http://localhost:4000/api
###############################################################################

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
API_URL="${1:-http://localhost:4000/api}"
TEMP_DIR=$(mktemp -d)
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
COURSE_ID=""
MODULE_ID=""
LESSON_ID=""
QUIZ_ID=""
LAB_ID=""
ENROLLMENT_ID=""

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

###############################################################################
# Funciones Auxiliares
###############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local description=$5

    ((TOTAL_TESTS++))

    log_info "Testing: $description"
    log_info "  $method $endpoint"

    local response_file="$TEMP_DIR/response_$TOTAL_TESTS.json"
    local status_code

    if [ -z "$data" ]; then
        if [ -z "$auth_header" ]; then
            status_code=$(curl -s -o "$response_file" -w "%{http_code}" -X "$method" "$API_URL$endpoint")
        else
            status_code=$(curl -s -o "$response_file" -w "%{http_code}" -X "$method" \
                -H "Authorization: Bearer $auth_header" \
                "$API_URL$endpoint")
        fi
    else
        if [ -z "$auth_header" ]; then
            status_code=$(curl -s -o "$response_file" -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        else
            status_code=$(curl -s -o "$response_file" -w "%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $auth_header" \
                -d "$data" \
                "$API_URL$endpoint")
        fi
    fi

    # Validar código de estado esperado
    if [[ "$status_code" -ge 200 && "$status_code" -lt 300 ]]; then
        log_success "Status: $status_code"
        echo "$response_file"
        return 0
    elif [[ "$status_code" -eq 401 ]]; then
        log_warning "Status: $status_code (Unauthorized - expected for protected endpoints)"
        return 1
    else
        log_error "Status: $status_code"
        if [ -f "$response_file" ]; then
            cat "$response_file" | jq '.' 2>/dev/null || cat "$response_file"
        fi
        return 1
    fi
}

###############################################################################
# Tests de Health Check
###############################################################################

test_health_endpoints() {
    echo ""
    echo "=========================================="
    echo "1. HEALTH CHECK ENDPOINTS"
    echo "=========================================="

    test_endpoint "GET" "/health" "" "" "Health check básico"
    test_endpoint "GET" "/health/ready" "" "" "Readiness check (DB + Redis)"
    test_endpoint "GET" "/health/live" "" "" "Liveness check"
}

###############################################################################
# Tests de Autenticación
###############################################################################

test_auth_endpoints() {
    echo ""
    echo "=========================================="
    echo "2. AUTHENTICATION ENDPOINTS"
    echo "=========================================="

    # Generar email único para testing
    local test_email="test_$(date +%s)@example.com"
    local test_password="Test123!@#"
    local test_name="Test User"

    # Test: Registro
    local register_data="{\"email\":\"$test_email\",\"password\":\"$test_password\",\"name\":\"$test_name\"}"
    local response_file=$(test_endpoint "POST" "/auth/register" "$register_data" "" "Registro de nuevo usuario")

    if [ -f "$response_file" ]; then
        ACCESS_TOKEN=$(cat "$response_file" | jq -r '.accessToken // .data.accessToken // empty')
        REFRESH_TOKEN=$(cat "$response_file" | jq -r '.refreshToken // .data.refreshToken // empty')
        USER_ID=$(cat "$response_file" | jq -r '.user.id // .data.user.id // empty')

        if [ -n "$ACCESS_TOKEN" ]; then
            log_success "Access Token obtenido: ${ACCESS_TOKEN:0:20}..."
        else
            log_error "No se pudo obtener access token del registro"
        fi
    fi

    # Test: Check email disponibilidad
    test_endpoint "GET" "/auth/check-email/available@test.com" "" "" "Verificar email disponible"
    test_endpoint "GET" "/auth/check-email/$test_email" "" "" "Verificar email ya registrado"

    # Test: Login
    local login_data="{\"email\":\"$test_email\",\"password\":\"$test_password\"}"
    local login_response=$(test_endpoint "POST" "/auth/login" "$login_data" "" "Login con credenciales")

    if [ -f "$login_response" ]; then
        ACCESS_TOKEN=$(cat "$login_response" | jq -r '.accessToken // .data.accessToken // empty')
        REFRESH_TOKEN=$(cat "$login_response" | jq -r '.refreshToken // .data.refreshToken // empty')

        if [ -n "$ACCESS_TOKEN" ]; then
            log_success "Login exitoso, token actualizado"
        fi
    fi

    # Test: Refresh token
    if [ -n "$REFRESH_TOKEN" ]; then
        local refresh_data="{\"refreshToken\":\"$REFRESH_TOKEN\"}"
        local refresh_response=$(test_endpoint "POST" "/auth/refresh" "$refresh_data" "" "Refresh de access token")

        if [ -f "$refresh_response" ]; then
            ACCESS_TOKEN=$(cat "$refresh_response" | jq -r '.accessToken // .data.accessToken // empty')
        fi
    fi
}

###############################################################################
# Tests de Usuarios
###############################################################################

test_user_endpoints() {
    echo ""
    echo "=========================================="
    echo "3. USER ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping user tests: No access token available"
        return
    fi

    # Test: Obtener perfil propio
    test_endpoint "GET" "/users/me" "" "$ACCESS_TOKEN" "Obtener perfil del usuario autenticado"

    # Test: Listar usuarios (requiere ADMIN)
    test_endpoint "GET" "/users" "" "$ACCESS_TOKEN" "Listar todos los usuarios (ADMIN)"

    # Test: Estadísticas de roles (requiere ADMIN)
    test_endpoint "GET" "/users/stats/roles" "" "$ACCESS_TOKEN" "Estadísticas de roles (ADMIN)"
}

###############################################################################
# Tests de Cursos
###############################################################################

test_course_endpoints() {
    echo ""
    echo "=========================================="
    echo "4. COURSE ENDPOINTS"
    echo "=========================================="

    # Test: Listar cursos (público)
    local courses_response=$(test_endpoint "GET" "/courses" "" "" "Listar cursos publicados (público)")

    if [ -f "$courses_response" ]; then
        COURSE_ID=$(cat "$courses_response" | jq -r '.[0].id // .data[0].id // empty')

        if [ -n "$COURSE_ID" ]; then
            log_success "Course ID obtenido: $COURSE_ID"
        else
            log_warning "No se encontraron cursos en el sistema"
        fi
    fi

    # Test: Obtener curso por ID (público)
    if [ -n "$COURSE_ID" ]; then
        test_endpoint "GET" "/courses/$COURSE_ID" "" "" "Obtener curso por ID (público)"
    fi

    # Tests con autenticación
    if [ -n "$ACCESS_TOKEN" ]; then
        # Test: Enrollments del usuario
        test_endpoint "GET" "/courses/enrolled" "" "$ACCESS_TOKEN" "Cursos en los que estoy inscrito"
        test_endpoint "GET" "/courses/my-enrollments" "" "$ACCESS_TOKEN" "Mis enrollments (alias)"

        # Test: Inscribirse en curso
        if [ -n "$COURSE_ID" ]; then
            local enroll_response=$(test_endpoint "POST" "/courses/$COURSE_ID/enroll" "" "$ACCESS_TOKEN" "Inscribirse en curso")

            if [ -f "$enroll_response" ]; then
                ENROLLMENT_ID=$(cat "$enroll_response" | jq -r '.enrollment.id // .data.enrollment.id // empty')
            fi

            # Test: Módulos del curso
            local modules_response=$(test_endpoint "GET" "/courses/$COURSE_ID/modules" "" "$ACCESS_TOKEN" "Obtener módulos del curso")

            if [ -f "$modules_response" ]; then
                MODULE_ID=$(cat "$modules_response" | jq -r '.[0].id // .data[0].id // empty')

                if [ -n "$MODULE_ID" ]; then
                    log_success "Module ID obtenido: $MODULE_ID"
                fi
            fi

            # Test: Progreso del curso
            test_endpoint "GET" "/courses/$COURSE_ID/progress" "" "$ACCESS_TOKEN" "Obtener progreso del curso"

            # Test: Estadísticas del curso
            test_endpoint "GET" "/courses/$COURSE_ID/stats" "" "" "Estadísticas del curso"
        fi
    fi
}

###############################################################################
# Tests de Módulos
###############################################################################

test_module_endpoints() {
    echo ""
    echo "=========================================="
    echo "5. MODULE ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping module tests: No access token available"
        return
    fi

    if [ -z "$MODULE_ID" ]; then
        log_warning "Skipping module tests: No module ID available"
        return
    fi

    # Test: Obtener módulo
    test_endpoint "GET" "/modules/$MODULE_ID" "" "$ACCESS_TOKEN" "Obtener módulo por ID"

    # Test: Lecciones del módulo
    local lessons_response=$(test_endpoint "GET" "/modules/$MODULE_ID/lessons" "" "$ACCESS_TOKEN" "Lecciones del módulo")

    if [ -f "$lessons_response" ]; then
        LESSON_ID=$(cat "$lessons_response" | jq -r '.[0].id // .data[0].id // empty')

        if [ -n "$LESSON_ID" ]; then
            log_success "Lesson ID obtenido: $LESSON_ID"
        fi
    fi

    # Test: Progreso del módulo
    test_endpoint "GET" "/modules/$MODULE_ID/progress" "" "$ACCESS_TOKEN" "Progreso del módulo"
}

###############################################################################
# Tests de Lecciones
###############################################################################

test_lesson_endpoints() {
    echo ""
    echo "=========================================="
    echo "6. LESSON ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping lesson tests: No access token available"
        return
    fi

    if [ -z "$LESSON_ID" ]; then
        log_warning "Skipping lesson tests: No lesson ID available"
        return
    fi

    # Test: Obtener lección
    test_endpoint "GET" "/lessons/$LESSON_ID" "" "$ACCESS_TOKEN" "Obtener lección con contenido"

    # Test: Marcar como completada
    test_endpoint "POST" "/lessons/$LESSON_ID/complete" "" "$ACCESS_TOKEN" "Marcar lección como completada"

    # Test: Progreso de lección
    test_endpoint "GET" "/lessons/$LESSON_ID/progress" "" "$ACCESS_TOKEN" "Progreso de la lección"
}

###############################################################################
# Tests de Quizzes
###############################################################################

test_quiz_endpoints() {
    echo ""
    echo "=========================================="
    echo "7. QUIZ ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping quiz tests: No access token available"
        return
    fi

    # Buscar un quiz en el módulo actual
    if [ -n "$MODULE_ID" ]; then
        # Este endpoint no existe, pero podríamos buscar quizzes en las lecciones
        log_info "Quiz testing pendiente: necesita ID de quiz específico"
    fi
}

###############################################################################
# Tests de Labs
###############################################################################

test_lab_endpoints() {
    echo ""
    echo "=========================================="
    echo "8. LAB ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping lab tests: No access token available"
        return
    fi

    # Similar a quizzes, necesitaríamos un LAB_ID específico
    log_info "Lab testing pendiente: necesita ID de lab específico"
}

###############################################################################
# Tests de Admin
###############################################################################

test_admin_endpoints() {
    echo ""
    echo "=========================================="
    echo "9. ADMIN ENDPOINTS"
    echo "=========================================="

    if [ -z "$ACCESS_TOKEN" ]; then
        log_warning "Skipping admin tests: No access token available"
        return
    fi

    # Test: Dashboard stats (requiere ADMIN)
    test_endpoint "GET" "/admin/stats" "" "$ACCESS_TOKEN" "Dashboard statistics (ADMIN)"

    # Test: Listar enrollments (requiere ADMIN)
    test_endpoint "GET" "/admin/enrollments?page=1&limit=10" "" "$ACCESS_TOKEN" "Listar enrollments (ADMIN)"

    # Test: User enrollments (requiere ADMIN)
    if [ -n "$USER_ID" ]; then
        test_endpoint "GET" "/admin/users/$USER_ID/enrollments" "" "$ACCESS_TOKEN" "Enrollments de usuario específico (ADMIN)"
    fi
}

###############################################################################
# Tests de Training Profiles
###############################################################################

test_training_profile_endpoints() {
    echo ""
    echo "=========================================="
    echo "10. TRAINING PROFILE ENDPOINTS"
    echo "=========================================="

    # Test: Listar perfiles (público)
    test_endpoint "GET" "/training-profiles" "" "" "Listar perfiles de entrenamiento (público)"
}

###############################################################################
# Limpieza
###############################################################################

cleanup() {
    log_info "Limpiando archivos temporales..."
    rm -rf "$TEMP_DIR"

    # Opcional: Logout
    if [ -n "$REFRESH_TOKEN" ]; then
        log_info "Cerrando sesión..."
        local logout_data="{\"refreshToken\":\"$REFRESH_TOKEN\"}"
        curl -s -X POST -H "Content-Type: application/json" -d "$logout_data" "$API_URL/auth/logout" > /dev/null
    fi
}

###############################################################################
# Main
###############################################################################

main() {
    echo "=========================================="
    echo "  VALIDACIÓN DE ENDPOINTS BACKEND"
    echo "  API URL: $API_URL"
    echo "=========================================="

    # Verificar que jq está instalado
    if ! command -v jq &> /dev/null; then
        log_error "jq no está instalado. Instalar con: apt-get install jq / brew install jq"
        exit 1
    fi

    # Ejecutar tests
    test_health_endpoints
    test_auth_endpoints
    test_user_endpoints
    test_course_endpoints
    test_module_endpoints
    test_lesson_endpoints
    test_quiz_endpoints
    test_lab_endpoints
    test_admin_endpoints
    test_training_profile_endpoints

    # Limpieza
    cleanup

    # Resumen
    echo ""
    echo "=========================================="
    echo "  RESUMEN DE TESTS"
    echo "=========================================="
    echo -e "Total:   ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed:  ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed:  ${RED}$FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}✓ TODOS LOS TESTS PASARON${NC}"
        exit 0
    else
        echo -e "\n${RED}✗ ALGUNOS TESTS FALLARON${NC}"
        exit 1
    fi
}

# Trap para limpieza en caso de error
trap cleanup EXIT

# Ejecutar
main
