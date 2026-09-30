@echo off
title Servidor - Mummy Thirst
echo ====================================================
echo             MUMMY THIRST - SERVIDOR LOCAL
echo ====================================================
echo.
echo Iniciando servidor web con Node.js...
echo.
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar el servidor. Verifica que Node.js este instalado y que hayas ejecutado install.bat.
)
pause
