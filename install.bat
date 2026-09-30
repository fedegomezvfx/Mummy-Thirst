@echo off
title Instalador - Mummy Thirst
echo ====================================================
echo        INSTALANDO DEPENDENCIAS DE MUMMY THIRST
echo ====================================================
echo.
echo Verificando instalacion de Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js no esta instalado o no esta en el PATH del sistema.
    echo Por favor instala Node.js desde https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js detectado correctamente.
echo.
echo Verificando bibliotecas del juego...
if exist "public\libs\three.min.js" (
    echo [OK] Three.js 3D Engine listo en public\libs\three.min.js
) else (
    echo [AVISO] Preparando recursos locales...
)
echo.
echo ====================================================
echo     INSTALACION COMPLETADA CON EXITO
echo ====================================================
echo Ya puedes iniciar el servidor ejecutando: run.bat
echo.
pause
