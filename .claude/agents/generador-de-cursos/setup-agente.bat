@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   Instalador del Agente Gen-Curso
echo ========================================
echo.

:: Detectar directorio home de Claude
set "CLAUDE_DIR=%USERPROFILE%\.claude"

if not exist "%CLAUDE_DIR%" (
    echo ERROR: No se encontro el directorio de Claude Code en %CLAUDE_DIR%
    echo Asegurate de tener Claude Code instalado antes de ejecutar este script.
    pause
    exit /b 1
)

:: Obtener directorio donde esta este script (raiz del agente)
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"

echo Directorio del agente: %SCRIPT_DIR%
echo Directorio de Claude:  %CLAUDE_DIR%
echo.

:: --- Instalar el agente ---
set "AGENT_DEST=%CLAUDE_DIR%\agents\generador-de-cursos"

echo [1/4] Instalando agente en %AGENT_DEST% ...

if not exist "%CLAUDE_DIR%\agents" mkdir "%CLAUDE_DIR%\agents"
if not exist "%AGENT_DEST%" mkdir "%AGENT_DEST%"

xcopy /E /I /Y "%SCRIPT_DIR%\." "%AGENT_DEST%" >nul 2>&1

if errorlevel 1 (
    echo ERROR: No se pudo copiar el agente.
    pause
    exit /b 1
)
echo    OK

:: --- Crear skill /gen-curso ---
set "SKILL_DIR=%CLAUDE_DIR%\skills\gen-curso"

echo [2/4] Creando skill /gen-curso en %SKILL_DIR% ...

if not exist "%CLAUDE_DIR%\skills" mkdir "%CLAUDE_DIR%\skills"
if not exist "%SKILL_DIR%" mkdir "%SKILL_DIR%"

(
echo # Skill: gen-curso
echo.
echo Invoca el agente GeneradorDeCursos para crear cursos tecnicos completos de alta calidad.
echo.
echo ## Uso
echo.
echo ```
echo /gen-curso [tema opcional]
echo ```
echo.
echo ## Que hace este skill
echo.
echo Activa el agente `generador-de-cursos` ubicado en `~/.claude/agents/generador-de-cursos/`.
echo El agente guia al usuario paso a paso a traves de 6 fases:
echo.
echo 1. Cuestionario interactivo ^(8-12 min^)
echo 2. Investigacion automatica de fuentes ^(3-5 min^)
echo 3. Generacion de estructura modular ^(2-3 min^)
echo 4. Creacion de contenido, labs y evaluaciones en paralelo ^(15-25 min^)
echo 5. Validacion de calidad automatica ^(5-10 min^)
echo 6. Generacion de archivos seed para la plataforma LMS ^(2-3 min^)
echo.
echo ## Instrucciones para Claude
echo.
echo Cuando el usuario invoca /gen-curso:
echo.
echo 1. Leer el archivo completo del agente en `~/.claude/agents/generador-de-cursos/agent.md`
echo 2. Seguir el workflow de 6 fases definido en ese archivo
echo 3. Usar las 8 skills especializadas ubicadas en `~/.claude/agents/generador-de-cursos/skills/`
echo 4. Si el usuario proporciono un tema como argumento, usarlo como punto de partida del cuestionario
echo 5. Si no hay tema, comenzar la Fase 1 con la primera pregunta del cuestionario
echo.
echo ## Notas
echo.
echo - El agente guarda checkpoints en `.claude/checkpoint-*.json` para permitir reanudar si se interrumpe
echo - Todo el contenido generado se guarda en la carpeta `contenidos/` del proyecto actual
echo - El agente valida sintaxis de codigo, links activos y formato de evaluaciones automaticamente
) > "%SKILL_DIR%\SKILL.md"

if errorlevel 1 (
    echo ERROR: No se pudo crear el skill.
    pause
    exit /b 1
)
echo    OK

:: --- Verificar instalacion ---
echo [3/4] Verificando instalacion ...

set "OK=1"
if not exist "%AGENT_DEST%\agent.md" set "OK=0"
if not exist "%AGENT_DEST%\skills\validacion.md" set "OK=0"
if not exist "%AGENT_DEST%\skills\evaluaciones.md" set "OK=0"
if not exist "%SKILL_DIR%\SKILL.md" set "OK=0"

if "%OK%"=="0" (
    echo ERROR: La verificacion fallo. Algunos archivos no se copiaron correctamente.
    pause
    exit /b 1
)
echo    OK

:: --- Mostrar resumen ---
echo [4/4] Instalacion completada.
echo.
echo ========================================
echo   Listo para usar
echo ========================================
echo.
echo El agente esta instalado. Para usarlo:
echo.
echo   1. Abre Claude Code en cualquier proyecto
echo   2. Escribe:  /gen-curso
echo      o con tema:  /gen-curso ciberseguridad
echo.
echo El agente te guiara paso a paso para generar
echo un curso tecnico completo de alta calidad.
echo.
pause
