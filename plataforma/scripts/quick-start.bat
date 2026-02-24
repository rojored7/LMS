@echo off
REM Script de inicio rapido de la plataforma

echo =====================================================
echo  INICIO RAPIDO - PLATAFORMA MULTI-CURSO
echo =====================================================
echo.

REM Colores
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set RESET=[0m

echo %BLUE%Paso 1/5:%RESET% Verificando requisitos...
call scripts\verify-setup.bat
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo %RED%Verificacion fallida. Corrige los errores antes de continuar.%RESET%
    pause
    exit /b 1
)
echo.

echo %BLUE%Paso 2/5:%RESET% Construyendo imagen sandbox...
echo %YELLOW%Esto puede tomar varios minutos la primera vez...%RESET%
cd executor
docker build -f Dockerfile.sandbox -t ciber-sandbox:latest .
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Error construyendo imagen sandbox%RESET%
    cd ..
    pause
    exit /b 1
)
cd ..
echo %GREEN%Imagen sandbox construida exitosamente%RESET%
echo.

echo %BLUE%Paso 3/5:%RESET% Iniciando servicios Docker...
echo %YELLOW%Esto puede tomar 1-2 minutos...%RESET%
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo %RED%Error iniciando servicios%RESET%
    pause
    exit /b 1
)
echo %GREEN%Servicios iniciados%RESET%
echo.

echo %BLUE%Paso 4/5:%RESET% Esperando a que los servicios esten listos...
timeout /t 30 /nobreak >nul
echo %GREEN%Servicios listos%RESET%
echo.

echo %BLUE%Paso 5/5:%RESET% Importando curso inicial...
docker-compose run --rm importer npm run seed:ciber-course
if %ERRORLEVEL% NEQ 0 (
    echo %YELLOW%Nota: El importer aun no esta completamente implementado%RESET%
    echo %YELLOW%      Puedes omitir este paso por ahora%RESET%
)
echo %GREEN%Curso importado%RESET%
echo.

echo =====================================================
echo  PLATAFORMA LISTA!
echo =====================================================
echo.
echo %GREEN%La plataforma esta funcionando en:%RESET%
echo.
echo   %BLUE%Frontend:%RESET%  http://localhost:3000
echo   %BLUE%Backend:%RESET%   http://localhost:4000
echo   %BLUE%Executor:%RESET%  http://localhost:5000
echo   %BLUE%Nginx:%RESET%     http://localhost
echo.
echo %YELLOW%Credenciales de prueba:%RESET%
echo   Admin:      admin@ciberplatform.com / Admin123!
echo   Instructor: instructor@ciberplatform.com / Instructor123!
echo   Student:    student@ciberplatform.com / Student123!
echo.
echo %BLUE%Comandos utiles:%RESET%
echo   make logs         - Ver logs en tiempo real
echo   make stop         - Detener servicios
echo   make restart      - Reiniciar servicios
echo   make status       - Ver estado del proyecto
echo.
pause
