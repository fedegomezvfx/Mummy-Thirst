@echo off
title Servidor - Mummy Thirst
echo ====================================================
echo             MUMMY THIRST - SERVIDOR LOCAL
echo ====================================================
echo.
echo Verificando Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se encontro Node.js en tu sistema o no esta en el PATH.
    echo Por favor instala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Iniciando servidor web con Node.js...
echo.
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El servidor se ha detenido con codigo de error %ERRORLEVEL%.
)
echo.
pause
