#!/bin/bash
echo "🧪 Test du token Go.cam avec traçage SDK"

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  echo "❌ Aucun token fourni. Usage : ./go-cam-live-test.sh <TOKEN>"
  exit 1
fi

# Appel du SDK via le bon endpoint
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
