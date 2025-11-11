#!/bin/bash

echo "🔧 Remplacement de RTCPeerConnection(config) par RTCPeerConnection(RTC_CONFIG)..."

TARGET_DIR="/var/www/legalshufflecam/public/js"
FILES=$(find "$TARGET_DIR" -type f -name '*.js' ! -name '*.bak*')

for FILE in $FILES; do
  if grep -q 'new RTCPeerConnection(config)' "$FILE"; then
    echo "📁 Fichier modifié : $FILE"
    BACKUP="$FILE.bak.$(date +%Y%m%d-%H%M%S)"
    cp "$FILE" "$BACKUP"
    sed -i 's/new RTCPeerConnection(config)/new RTCPeerConnection(RTC_CONFIG)/g' "$FILE"
    echo "✅ Remplacement effectué"
  else
    echo "ℹ️ Aucun remplacement nécessaire dans : $FILE"
  fi
done

echo "🎯 Remplacement terminé"
