#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "========================================"
echo "  Instalador del Agente Gen-Curso"
echo "========================================"
echo ""

CLAUDE_DIR="${HOME}/.claude"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ ! -d "$CLAUDE_DIR" ]; then
    echo "ERROR: No se encontro el directorio de Claude Code en $CLAUDE_DIR"
    echo "Asegurate de tener Claude Code instalado antes de ejecutar este script."
    exit 1
fi

echo "Directorio del agente: $SCRIPT_DIR"
echo "Directorio de Claude:  $CLAUDE_DIR"
echo ""

# --- Instalar el agente ---
AGENT_DEST="$CLAUDE_DIR/agents/generador-de-cursos"

echo "[1/4] Instalando agente en $AGENT_DEST ..."
mkdir -p "$AGENT_DEST"
cp -r "$SCRIPT_DIR/." "$AGENT_DEST/"
echo "   OK"

# --- Crear skill /gen-curso ---
SKILL_DIR="$CLAUDE_DIR/skills/gen-curso"

echo "[2/4] Creando skill /gen-curso en $SKILL_DIR ..."
mkdir -p "$SKILL_DIR"

cat > "$SKILL_DIR/SKILL.md" << 'SKILLEOF'
# Skill: gen-curso

Invoca el agente GeneradorDeCursos para crear cursos tecnicos completos de alta calidad.

## Uso

```
/gen-curso [tema opcional]
```

## Que hace este skill

Activa el agente `generador-de-cursos` ubicado en `~/.claude/agents/generador-de-cursos/`.
El agente guia al usuario paso a paso a traves de 6 fases:

1. Cuestionario interactivo (8-12 min)
2. Investigacion automatica de fuentes (3-5 min)
3. Generacion de estructura modular (2-3 min)
4. Creacion de contenido, labs y evaluaciones en paralelo (15-25 min)
5. Validacion de calidad automatica (5-10 min)
6. Generacion de archivos seed para la plataforma LMS (2-3 min)

## Instrucciones para Claude

Cuando el usuario invoca /gen-curso:

1. Leer el archivo completo del agente en `~/.claude/agents/generador-de-cursos/agent.md`
2. Seguir el workflow de 6 fases definido en ese archivo
3. Usar las 8 skills especializadas ubicadas en `~/.claude/agents/generador-de-cursos/skills/`
4. Si el usuario proporciono un tema como argumento, usarlo como punto de partida del cuestionario
5. Si no hay tema, comenzar la Fase 1 con la primera pregunta del cuestionario

## Notas

- El agente guarda checkpoints en `.claude/checkpoint-*.json` para permitir reanudar si se interrumpe
- Todo el contenido generado se guarda en la carpeta `contenidos/` del proyecto actual
- El agente valida sintaxis de codigo, links activos y formato de evaluaciones automaticamente
SKILLEOF

echo "   OK"

# --- Verificar instalacion ---
echo "[3/4] Verificando instalacion ..."

ERRORS=0
for f in "$AGENT_DEST/agent.md" "$AGENT_DEST/skills/validacion.md" "$AGENT_DEST/skills/evaluaciones.md" "$SKILL_DIR/SKILL.md"; do
    if [ ! -f "$f" ]; then
        echo "   FALTA: $f"
        ERRORS=$((ERRORS + 1))
    fi
done

if [ "$ERRORS" -gt 0 ]; then
    echo "ERROR: La verificacion fallo. $ERRORS archivo(s) no se copiaron correctamente."
    exit 1
fi
echo "   OK"

# --- Mostrar resumen ---
echo "[4/4] Instalacion completada."
echo ""
echo "========================================"
echo "  Listo para usar"
echo "========================================"
echo ""
echo "El agente esta instalado. Para usarlo:"
echo ""
echo "  1. Abre Claude Code en cualquier proyecto"
echo "  2. Escribe:  /gen-curso"
echo "     o con tema:  /gen-curso ciberseguridad"
echo ""
echo "El agente te guiara paso a paso para generar"
echo "un curso tecnico completo de alta calidad."
echo ""
