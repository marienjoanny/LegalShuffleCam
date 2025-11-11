#!/bin/bash

echo "🔍 Vérification du signalement LegalShuffleCam..."

APP_JS="app.js"
SERVER_JS="server.js"
REPORT_DIR="api/logs/reports"

# 1. Vérifie que app.js contient le bon ID
echo "📄 Vérification de l'ID du bouton dans $APP_JS..."
grep -q "getElementById('btnReport')" "$APP_JS" && echo "✅ ID btnReport OK" || echo "❌ btnReport manquant dans app.js"

# 2. Vérifie que la route /api/report existe dans server.js
echo "🌐 Vérification de la route /api/report dans $SERVER_JS..."
grep -q "app.post('/api/report'" "$SERVER_JS" && echo "✅ Route /api/report détectée" || echo "❌ Route /api/report absente"

# 3. Vérifie que le dossier de stockage existe
echo "📁 Vérification du dossier $REPORT_DIR..."
[ -d "$REPORT_DIR" ] && echo "✅ Dossier de signalements présent" || echo "❌ Dossier manquant : $REPORT_DIR"

# 4. Vérifie que le serveur écoute sur le port 3000
echo "🔌 Vérification du port 3000..."
netstat -tuln | grep -q ":3000" && echo "✅ Serveur actif sur le port 3000" || echo "❌ Serveur non détecté sur le port 3000"

# 5. Vérifie les permissions d’écriture
echo "📝 Vérification des permissions d’écriture dans $REPORT_DIR..."
touch "$REPORT_DIR/test-write.json" 2>/dev/null && echo "✅ Écriture possible" && rm "$REPORT_DIR/test-write.json" || echo "❌ Échec d’écriture dans $REPORT_DIR"

echo "✅ Vérification terminée."
