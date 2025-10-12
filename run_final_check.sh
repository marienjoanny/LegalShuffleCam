#!/bin/bash
# Script de vérification finale de l'état du serveur et des dépendances.

ROOT_PATH="/var/www/legalshufflecam"
PORT=3000

echo "=========================================================="
echo "--- 🛑 1. ARRÊT DU SERVEUR (S'IL EST EN COURS) ---"
echo "=========================================================="
PID=$(sudo lsof -t -i :$PORT -sTCP:LISTEN)
if [ ! -z "$PID" ]; then 
    sudo kill -9 $PID
    echo "✅ Processus $PID arrêté : $PID"
fi

echo ""
echo "=========================================================="
echo "--- ♻️ 2. VÉRIFICATION DES DÉPENDANCES NPM ---"
echo "=========================================================="

cd "$ROOT_PATH" || { echo "Erreur: Impossible de se déplacer vers $ROOT_PATH"; exit 1; }

if [ ! -d "node_modules" ]; then
    echo "⚠️ Le dossier node_modules est manquant. Tentative de réinstallation..."
    if npm install; then
        echo "✅ Réinstallation réussie."
    else
        echo "❌ Échec critique de l'installation des dépendances."
        exit 1
    fi
else
    echo "✅ Le dossier node_modules est présent."
fi

echo ""
echo "=========================================================="
echo "--- 🚀 3. RELANCEMENT FINAL DU SERVEUR ---"
echo "=========================================================="

# Lancer le serveur en arrière-plan
node server.js &
SERVER_PID=$!
sleep 3
if sudo lsof -t -i :$PORT -sTCP:LISTEN >/dev/null; then
    echo "✅ Serveur démarré sur le port $PORT. PID: $(sudo lsof -t -i :$PORT -sTCP:LISTEN)"
    echo "--- !!! Videz votre cache et testez maintenant !!! ---"
else
    echo "❌ Le serveur a échoué au démarrage."
    echo "Veuillez vérifier les logs ou le message d'erreur."
fi
