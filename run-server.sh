#!/bin/bash
# Script de lancement/redémarrage du serveur Node.js LegalShuffleCam.

SERVER_FILE="listener.js"

echo "--- 🛑 Arrêt du serveur précédent... (si actif) ---"
# Tuer le processus node qui exécute listener.js
pkill -f "node $SERVER_FILE"

# Attendre une seconde pour s'assurer que le port est libéré
sleep 1

echo "--- 🚀 Lancement du nouveau serveur Node.js ---"

# Lancer le serveur en arrière-plan
node "$SERVER_FILE" &

# Afficher l'ID du processus pour confirmation
PID=$!
echo "✅ Serveur LegalShuffleCam lancé en arrière-plan (PID: $PID)."
echo "   Vérifiez le log des erreurs ou le terminal pour les messages de lancement."

# Optionnel : Afficher les dernières lignes du log de modération
echo ""
echo "--- Dernière entrée du Log de Modération ---"
tail -n 1 /var/log/legalshufflecam-moderation.log 2>/dev/null || echo "Log de modération vide ou non accessible."

echo "----------------------------------------------"
echo "L'application est prête pour le test."

