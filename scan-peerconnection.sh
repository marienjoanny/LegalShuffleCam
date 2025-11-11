#!/bin/bash

ROOT="/var/www/legalshufflecam/public"

echo "🔍 Scan des fichiers JS pour RTCPeerConnection..."

find "$ROOT" "$ROOT/js" -type f -name "*.js" | while read -r file; do
  if grep -q "RTCPeerConnection" "$file"; then
    echo -e "\n📄 Fichier : $file"
    grep -n "RTCPeerConnection" "$file" | while read -r line; do
      echo "📍 Ligne : $line"
    done
  fi
done

echo -e "\n✅ Scan terminé. Modifie ces blocs pour inclure la config TURN."
