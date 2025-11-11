#!/bin/bash

echo "🔍 Vérification de l'ordre de chargement dans index-real.php..."

FILE="public/index-real.php"

# Vérifie que app.js est inclus
if grep -q '<script src="app.js">' "$FILE"; then
  echo "✅ app.js est bien inclus."
else
  echo "❌ app.js n'est pas inclus dans index-real.php."
  exit 1
fi

# Vérifie que app.js est inclus avant tout appel à connectSocketAndWebRTC
LINE_APP=$(grep -n '<script src="app.js">' "$FILE" | cut -d: -f1)
LINE_CALL=$(grep -n 'connectSocketAndWebRTC' "$FILE" | head -n1 | cut -d: -f1)

if [ "$LINE_APP" -lt "$LINE_CALL" ]; then
  echo "✅ app.js est chargé avant les appels à connectSocketAndWebRTC."
else
  echo "❌ app.js est chargé APRÈS les appels à connectSocketAndWebRTC. Corrige l'ordre dans index-real.php."
fi
