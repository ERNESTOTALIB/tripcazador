#!/bin/bash
# ============================================
# Travel Hunter - Script de instalación
# ============================================
# Ejecutar: bash setup.sh

echo "🚀 Instalando Travel Hunter..."
echo "================================"

# 1. Instalar dependencias Python
echo ""
echo "📦 Instalando dependencias Python..."
pip install -r requirements.txt

# 2. Instalar navegadores de Playwright
echo ""
echo "🌐 Instalando navegadores (Chromium)..."
playwright install chromium
playwright install-deps chromium

# 3. Crear config.json si no existe
if [ ! -f config.json ]; then
    echo ""
    echo "📝 Creando config.json desde ejemplo..."
    cp config_example.json config.json
    echo "   ⚠️  IMPORTANTE: Edita config.json con tus datos antes de usar"
    echo "   - Configura tu email para notificaciones"
    echo "   - Ajusta las búsquedas a tus preferencias"
fi

echo ""
echo "✅ Instalación completada!"
echo ""
echo "Próximos pasos:"
echo "  1. Edita config.json con tus búsquedas y email"
echo "  2. Prueba con: python main.py urls"
echo "  3. Búsqueda rápida: python main.py quick --from SXB --to ATH --depart 2026-08-01 --return 2026-08-15 --adults 4"
echo "  4. Monitoreo: python main.py monitor"
