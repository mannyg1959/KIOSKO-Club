@echo off
echo ========================================
echo   Actualizando Repositorio en GitHub
echo   KIOSKO Club
echo ========================================
echo.
set /p mensaje="Describe tus cambios: "
echo.
echo Agregando archivos modificados...
git add .
echo.
echo Guardando cambios...
git commit -m "%mensaje%"
echo.
echo Subiendo a GitHub...
git push origin main
echo.
echo ========================================
echo   Cambios subidos exitosamente!
echo   Vercel actualizara en 2-3 minutos
echo ========================================
echo.
pause
