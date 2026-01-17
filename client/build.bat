@echo off
echo ========================================
echo   Construyendo aplicacion para produccion
echo   Vite + React
echo ========================================
echo.
node node_modules/vite/bin/vite.js build
echo.
echo ========================================
echo   Build completado!
echo ========================================
pause
