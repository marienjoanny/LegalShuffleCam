#!/bin/bash

echo "🔍 Détection et injection de la config TURN coturn dans /public/js..."

BLOCK="const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
      username: 'user',
      credential: '6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c'
    }
  ]
};"

TARGET_DIR="/var/www/legalshufflecam/public/js"
FILES=$(find "$TARGET_DIR" -type f -name '*.js' ! -name '*.bak*')

for FILE in $FILES; do
  echo "📁 Fichier : $FILE"

  if grep -q 'turn:legalshufflecam.ovh' "$FILE"; then
    echo "✅ Config TURN déjà présente"
  elif grep -q 'iceServers' "$FILE"; then
    echo "⚠️ iceServers présent mais sans coturn — modification manuelle recommandée"
  elif grep -q 'RTCPeerConnection' "$FILE"; then
    echo "🚀 Injection du bloc TURN"
    BACKUP="$FILE.bak.$(date +%Y%m%d-%H%M%S)"
    cp "$FILE" "$BACKUP"
    awk -v block="$BLOCK" '
      /RTCPeerConnection/ && !found {
        print block;
        found=1
      }
      { print }
    ' "$BACKUP" > "$FILE"
    echo "✅ Bloc TURN injecté"
  else
    echo "ℹ️ Aucun RTCPeerConnection détecté — rien à faire"
  fi

  echo "----------------------------------------"
done

echo "🎯 Analyse terminée"
