@echo off
REM Script de verificación de setup completo de la plataforma

echo =====================================================
echo  VERIFICACION DE SETUP - PLATAFORMA MULTI-CURSO
echo =====================================================
echo.

REM Variables de colores (limitadas en CMD)
set GREEN=[92m
set YELLOW=[93m
set RED=[91m
set RESET=[0m

echo [1/10] Verificando Docker...
docker --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Docker instalado
    docker --version
) else (
    echo %RED%[ERROR]%RESET% Docker no encontrado
    echo        Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop
    set HAS_ERROR=1
)
echo.

echo [2/10] Verificando Docker Compose...
docker-compose --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Docker Compose instalado
    docker-compose --version
) else (
    echo %RED%[ERROR]%RESET% Docker Compose no encontrado
    set HAS_ERROR=1
)
echo.

echo [3/10] Verificando Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %GREEN%[OK]%RESET% Node.js instalado
    node --version
) else (
    echo %YELLOW%[WARN]%RESET% Node.js no encontrado
    echo        Solo necesario para desarrollo local
)
echo.

echo [4/10] Verificando archivo .env...
if exist .env (
    echo %GREEN%[OK]%RESET% Archivo .env existe
) else (
    echo %YELLOW%[WARN]%RESET% Archivo .env no encontrado
    echo        Copia .env.example a .env y configura tus valores
    copy .env.example .env >nul 2>&1
    echo        Se ha creado .env desde .env.example
)
echo.

echo [5/10] Verificando estructura de carpetas...
set DIRS=backend frontend executor nginx content-importer docs database scripts
set ALL_DIRS_OK=1
for %%D in (%DIRS%) do (
    if exist %%D\ (
        echo %GREEN%[OK]%RESET% Carpeta %%D encontrada
    ) else (
        echo %RED%[ERROR]%RESET% Carpeta %%D no encontrada
        set ALL_DIRS_OK=0
        set HAS_ERROR=1
    )
)
echo.

echo [6/10] Verificando archivos de configuracion...
if exist docker-compose.yml (
    echo %GREEN%[OK]%RESET% docker-compose.yml
) else (
    echo %RED%[ERROR]%RESET% docker-compose.yml no encontrado
    set HAS_ERROR=1
)

if exist Makefile (
    echo %GREEN%[OK]%RESET% Makefile
) else (
    echo %YELLOW%[WARN]%RESET% Makefile no encontrado (opcional)
)
echo.

echo [7/10] Verificando Backend...
if exist backend\package.json (
    echo %GREEN%[OK]%RESET% backend\package.json
) else (
    echo %RED%[ERROR]%RESET% backend\package.json no encontrado
    set HAS_ERROR=1
)

if exist backend\prisma\schema.prisma (
    echo %GREEN%[OK]%RESET% backend\prisma\schema.prisma
) else (
    echo %RED%[ERROR]%RESET% backend\prisma\schema.prisma no encontrado
    set HAS_ERROR=1
)

if exist backend\src\server.ts (
    echo %GREEN%[OK]%RESET% backend\src\server.ts
) else (
    echo %RED%[ERROR]%RESET% backend\src\server.ts no encontrado
    set HAS_ERROR=1
)
echo.

echo [8/10] Verificando Frontend...
if exist frontend\package.json (
    echo %GREEN%[OK]%RESET% frontend\package.json
) else (
    echo %RED%[ERROR]%RESET% frontend\package.json no encontrado
    set HAS_ERROR=1
)

if exist frontend\src\main.tsx (
    echo %GREEN%[OK]%RESET% frontend\src\main.tsx
) else (
    echo %RED%[ERROR]%RESET% frontend\src\main.tsx no encontrado
    set HAS_ERROR=1
)

if exist frontend\src\App.tsx (
    echo %GREEN%[OK]%RESET% frontend\src\App.tsx
) else (
    echo %RED%[ERROR]%RESET% frontend\src\App.tsx no encontrado
    set HAS_ERROR=1
)
echo.

echo [9/10] Verificando Executor...
if exist executor\package.json (
    echo %GREEN%[OK]%RESET% executor\package.json
) else (
    echo %RED%[ERROR]%RESET% executor\package.json no encontrado
    set HAS_ERROR=1
)

if exist executor\src\server.ts (
    echo %GREEN%[OK]%RESET% executor\src\server.ts
) else (
    echo %RED%[ERROR]%RESET% executor\src\server.ts no encontrado
    set HAS_ERROR=1
)

if exist executor\Dockerfile.sandbox (
    echo %GREEN%[OK]%RESET% executor\Dockerfile.sandbox
) else (
    echo %RED%[ERROR]%RESET% executor\Dockerfile.sandbox no encontrado
    set HAS_ERROR=1
)
echo.

echo [10/10] Verificando Documentacion...
if exist docs\arquitectura.md (
    echo %GREEN%[OK]%RESET% docs\arquitectura.md
) else (
    echo %RED%[ERROR]%RESET% docs\arquitectura.md no encontrado
    set HAS_ERROR=1
)

if exist docs\backlog.md (
    echo %GREEN%[OK]%RESET% docs\backlog.md
) else (
    echo %RED%[ERROR]%RESET% docs\backlog.md no encontrado
    set HAS_ERROR=1
)

if exist docs\historias-usuario\ (
    echo %GREEN%[OK]%RESET% docs\historias-usuario\
) else (
    echo %RED%[ERROR]%RESET% docs\historias-usuario\ no encontrada
    set HAS_ERROR=1
)
echo.

echo =====================================================
echo  RESULTADO DE LA VERIFICACION
echo =====================================================

if "%HAS_ERROR%"=="1" (
    echo %RED%[FALLO]%RESET% Se encontraron errores en el setup
    echo.
    echo Por favor revisa los errores anteriores y corrigelos antes de continuar.
    exit /b 1
) else (
    echo %GREEN%[EXITO]%RESET% Setup completo y verificado
    echo.
    echo Puedes continuar con:
    echo   1. make start   (o docker-compose up -d)
    echo   2. make seed    (o docker-compose run --rm importer npm run seed:ciber-course)
    echo   3. Accede a http://localhost:3000
    exit /b 0
)
