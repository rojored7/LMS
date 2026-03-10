#!/bin/bash
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script de Limpieza Automática de Archivos Basura
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Uso: ./cleanup.sh [--dry-run]
#
# Este script elimina archivos temporales y basura del proyecto según las
# reglas definidas en .gitignore. Los archivos en node_modules/ NO se tocan.
#
# Opciones:
#   --dry-run    Muestra qué archivos se eliminarían sin eliminarlos
#   --help       Muestra esta ayuda
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Modo dry-run
DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║              MODO DRY-RUN (SIMULACIÓN)                        ║${NC}"
    echo -e "${YELLOW}║   No se eliminarán archivos, solo se mostrarán               ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
fi

if [[ "$1" == "--help" ]]; then
    head -n 15 "$0" | tail -n +3
    exit 0
fi

# Contador de archivos
TOTAL_FILES=0
TOTAL_SIZE=0

# Función para eliminar archivos con patrón
cleanup_pattern() {
    local pattern="$1"
    local description="$2"
    local exclude_path="${3:-node_modules}"

    echo -e "${BLUE}🔍 Buscando: ${description}${NC}"

    # Encuentra archivos excluyendo node_modules y directorios de build
    local files=$(find . -type f -name "$pattern" \
        ! -path "*/node_modules/*" \
        ! -path "*/dist/*" \
        ! -path "*/build/*" \
        ! -path "*/.git/*" \
        ! -path "*/coverage/*" 2>/dev/null || true)

    if [[ -z "$files" ]]; then
        echo -e "  ${GREEN}✓${NC} No se encontraron archivos"
        return
    fi

    local count=0
    while IFS= read -r file; do
        if [[ -n "$file" ]]; then
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
            TOTAL_SIZE=$((TOTAL_SIZE + size))

            if [[ "$DRY_RUN" == true ]]; then
                echo -e "  ${YELLOW}[DRY-RUN]${NC} $file ($(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "$size bytes"))"
            else
                echo -e "  ${RED}✗${NC} Eliminando: $file"
                rm -f "$file"
            fi
            count=$((count + 1))
            TOTAL_FILES=$((TOTAL_FILES + 1))
        fi
    done <<< "$files"

    if [[ $count -gt 0 ]]; then
        echo -e "  ${GREEN}➜${NC} $count archivo(s) procesado(s)"
    fi
    echo ""
}

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        Limpieza Automática de Archivos Basura               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. Archivos de reporte y documentación temporal
cleanup_pattern "*REPORT*.md" "Reportes de implementación"
cleanup_pattern "*REPORTE*.md" "Reportes en español"
cleanup_pattern "*COMPLETE*.md" "Archivos de completitud"
cleanup_pattern "*COMPLETION*.md" "Archivos de completion"
cleanup_pattern "*SNAPSHOT*.md" "Snapshots de debug"
cleanup_pattern "*CHECKLIST*.md" "Checklists temporales"
cleanup_pattern "*VERIFICATION*.md" "Archivos de verificación"
cleanup_pattern "*VERIFICACION*.md" "Archivos de verificación (ES)"

# 2. Archivos de fixes y debug temporales
cleanup_pattern "*FIX*.md" "Archivos de fixes temporales"
cleanup_pattern "*IMPLEMENTATION*.md" "Documentos de implementación"
cleanup_pattern "*SETUP*.md" "Archivos de setup temporales"
cleanup_pattern "*ESTADO*.md" "Archivos de estado"
cleanup_pattern "*PROGRESO*.md" "Archivos de progreso"

# 3. Archivos específicos de features
cleanup_pattern "MOBILE_*.md" "Documentación mobile temporal"
cleanup_pattern "GENERADOR_*.md" "Documentación de generadores"
cleanup_pattern "VISUALIZADOR_*.md" "Documentación de visualizador"
cleanup_pattern "BACKEND_*.md" "Documentación backend temporal"
cleanup_pattern "FRONTEND_*.md" "Documentación frontend temporal"
cleanup_pattern "CAS_*.md" "Archivos CAS temporales"

# 4. Archivos de debug y logs
cleanup_pattern "*-snapshot.md" "Debug snapshots"
cleanup_pattern "*-attempt*.md" "Archivos de intentos"
cleanup_pattern "console-errors.txt" "Logs de consola"
cleanup_pattern "debug*.txt" "Archivos de debug"
cleanup_pattern "error*.txt" "Archivos de error"

# 5. Scripts temporales
cleanup_pattern "start_visualizador.*" "Scripts de visualizador"
cleanup_pattern "verificar_*.sh" "Scripts de verificación"
cleanup_pattern "temp_*.sh" "Scripts temporales"
cleanup_pattern "test_*.sh" "Scripts de test temporales"

# 6. Archivos .txt temporales (excluyendo importantes)
echo -e "${BLUE}🔍 Buscando archivos .txt temporales${NC}"
find . -type f -name "*.txt" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    ! -path "*/build/*" \
    ! -name "requirements.txt" \
    ! -name "package-lock.txt" \
    ! -name "LICENSE*.txt" \
    -print0 2>/dev/null | while IFS= read -r -d '' file; do

    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0")
    TOTAL_SIZE=$((TOTAL_SIZE + size))

    if [[ "$DRY_RUN" == true ]]; then
        echo -e "  ${YELLOW}[DRY-RUN]${NC} $file"
    else
        echo -e "  ${RED}✗${NC} Eliminando: $file"
        rm -f "$file"
    fi
    TOTAL_FILES=$((TOTAL_FILES + 1))
done
echo ""

# Resumen final
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                      RESUMEN                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}Se eliminarían: $TOTAL_FILES archivo(s)${NC}"
else
    echo -e "${GREEN}✓ Archivos eliminados: $TOTAL_FILES${NC}"
fi

# Convertir bytes a formato legible
if command -v numfmt &> /dev/null; then
    SIZE_READABLE=$(numfmt --to=iec-i --suffix=B $TOTAL_SIZE 2>/dev/null || echo "$TOTAL_SIZE bytes")
else
    SIZE_READABLE="$TOTAL_SIZE bytes"
fi

echo -e "${GREEN}✓ Espacio liberado: $SIZE_READABLE${NC}"
echo ""

if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}Para ejecutar la limpieza real, ejecuta:${NC}"
    echo -e "${YELLOW}  ./cleanup.sh${NC}"
    echo ""
fi

echo -e "${BLUE}💡 Tip: Los archivos están protegidos por .gitignore${NC}"
echo -e "${BLUE}   para evitar que vuelvan a aparecer en git.${NC}"
echo ""
