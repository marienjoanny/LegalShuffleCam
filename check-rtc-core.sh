#!/bin/bash

echo "🔍 Vérification de rtc-core.js..."

# Chemin probable
FILE="/var/www/legalshufflecam/rtc-core.js"

if [ ! -f "$FILE" ]; then
  echo "❌ Fichier introuvable : $FILE"
  echo "➡️ Vérifie le chemin ou adapte le script"
  exit 1
fi

echo "📁 Fichier trouvé : $FILE"

if grep -q 'iceServers' "$FILE"; then
  echo "✅ Bloc iceServers déjà présent"
else
  echo "⚠️ Bloc iceServers absent — tu peux l’ajouter juste avant la création de RTCPeerConnection"
  echo ""
  echo "📌 Exemple à coller dans $FILE :"
  echo ""
  echo "const config = {"
  echo "  iceServers: ["
  echo "    { urls: 'stun:stun.l.google.com:19302' },"
  echo "    {"
  echo "      urls: 'turn:legalshufflecam.ovh:3478?transport=udp',"
  echo "      username: 'user',"
  echo "      credential: '6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c'"
  echo "    }"
  echo "  ]"
  echo "};"
  echo ""
  echo "const peerConnection = new RTCPeerConnection(config);"
fi
