#!/bin/bash

ROOT="/var/www/legalshufflecam/public"
TURN_DOMAIN="legalshufflecam.ovh"
TURN_PORT="5349"

echo "🔍 Vérification des fichiers JS dans $ROOT et $ROOT/js..."

find "$ROOT" "$ROOT/js" -type f -name "*.js" | while read -r file; do
  echo -e "\n📄 Fichier : $file"

  grep -q "turns:$TURN_DOMAIN:$TURN_PORT" "$file" && echo "✅ TURN URL présent" || echo "❌ TURN URL absent"
  grep -q "username" "$file" && echo "✅ username présent" || echo "❌ username absent"
  grep -q "credential" "$file" && echo "✅ credential présent" || echo "❌ credential absent"
done
