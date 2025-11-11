#!/bin/bash

FILE="/var/www/legalshufflecam/public/app.js"

echo "🔍 Analyse de $FILE pour injection TURN/STUN"

if [ ! -f "$FILE" ]; then
  echo "❌ Fichier introuvable"
  exit 1
fi

if grep -q 'new RTCPeerConnection' "$FILE"; then
  echo "✅ RTCPeerConnection détecté"
  grep -n 'new RTCPeerConnection' "$FILE" | while IFS=: read -r line_num line_text; do
    echo "🔹 Ligne $line_num : $line_text"
    echo "   ➤ Contexte :"
    sed -n "$((line_num-2)),$((line_num+5))p" "$FILE" | sed 's/^/     /'
    echo ""
  done
else
  echo "❌ Aucun RTCPeerConnection détecté"
fi

if grep -q 'onicecandidate' "$FILE"; then
  echo "✅ Bloc onicecandidate déjà présent"
else
  echo "⚠️ Aucun bloc onicecandidate — tu peux l’ajouter juste après RTCPeerConnection"
fi

echo "🎯 Analyse terminée"
