#!/bin/bash

echo "========================================"
echo "  Actualizando GitHub - KIOSKO Club"
echo "========================================"
echo ""

# Pedir mensaje de commit
read -p "Describe tus cambios: " mensaje

# Verificar que se ingresó un mensaje
if [ -z "$mensaje" ]; then
    echo "❌ Error: Debes ingresar una descripción"
    exit 1
fi

echo ""
echo "📦 Agregando archivos modificados..."
git add .

echo ""
echo "💾 Guardando cambios..."
git commit -m "$mensaje"

# Verificar si el commit fue exitoso
if [ $? -ne 0 ]; then
    echo "❌ Error al hacer commit"
    exit 1
fi

echo ""
echo "🚀 Subiendo a GitHub..."
git push origin main

# Verificar si el push fue exitoso
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "  ✅ Cambios subidos exitosamente!"
    echo "  Vercel actualizará en 2-3 minutos"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "  ❌ Error al subir a GitHub"
    echo "  Verifica tu conexión a internet"
    echo "========================================"
    exit 1
fi

echo ""
