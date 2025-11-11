#!/bin/bash

echo "🚀 Injection du bloc TURN dans les fichiers WebRTC..."

BLOCK="const config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
      username: 'user',
      credential: '6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c'
    }
  ]
};"

# Fichiers ciblés
FILES=$(grep -rl 'RTCPeerConnection' /var/www/legalshufflecam | grep '\.js')

for FILE in $FILES; do
  echo "📁 Traitement : $FILE"
  if grep -q 'iceServers' "$FILE"; then
    echo "✅ Bloc déjà présent — rien à faire"
  else
    # Injection juste avant RTCPeerConnection
    sed -i "/RTCPeerConnection/i $BLOCK\n" "$FILE"
    echo "✅ Bloc TURN injecté"
  fi
  echo "----------------------------------------"
done

echo "🎯 Tous les fichiers ont été traités"
