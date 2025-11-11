#!/bin/bash
echo "🔍 Extraction et test du token Go.cam"

URL="$1"
if [[ -z "$URL" ]]; then
  echo "❌ Aucun lien fourni. Usage : ./trace-verify-flow.sh <URL>"
  exit 1
fi

# Extraction du token depuis l’URL
TOKEN=$(echo "$URL" | sed -n 's/.*[?&]d=\([^&]*\).*/\1/p')

if [[ -z "$TOKEN" ]]; then
  echo "❌ Token introuvable dans l’URL"
  exit 1
fi

echo "🧪 Token extrait : ${#TOKEN} caractères"

# Appel du SDK
curl -s -k -X POST -d "d=$TOKEN" -c cookies.txt https://localhost/callback.php

echo -e "\n🍪 Vérification du cookie reçu :"
if grep -q age_verified cookies.txt; then
  echo "✅ Cookie age_verified présent"
else
  echo "❌ Cookie age_verified absent"
fi

echo -e "\n📜 Dernières lignes du log SDK :"
tail -n 20 logs/fail.log

echo -e "\n🔍 Interprétation :"
if grep -q "vérification OK" logs/fail.log; then
  echo "✅ Token accepté par le SDK"
elif grep -q "rejet SDK" logs/fail.log; then
  echo "❌ Token rejeté par le SDK"
elif grep -q "token manquant" logs/fail.log; then
  echo "⚠️  Token non transmis à callback.php"
else
  echo "❓ Aucun verdict clair dans les logs"
fi
