#!/bin/bash
echo "🧪 Test de index.php avec token Go.cam"

URL="$1"
if [[ -z "$URL" ]]; then
  echo "❌ Aucun lien fourni. Usage : ./test-index-token.sh <URL>"
  exit 1
fi

# Extraction du token
TOKEN=$(echo "$URL" | sed -n 's/.*[?&]d=\([^&]*\).*/\1/p')
if [[ -z "$TOKEN" ]]; then
  echo "❌ Token introuvable dans l’URL"
  exit 1
fi

echo "🔍 Token extrait : ${#TOKEN} caractères"

# Appel de index.php avec le token
curl -s -k -c cookies.txt "https://localhost/index.php?d=$TOKEN"

echo -e "\n🍪 Vérification du cookie reçu :"
if grep -q age_verified cookies.txt; then
  echo "✅ Cookie age_verified présent"
else
  echo "❌ Cookie age_verified absent"
fi

echo -e "\n📜 Dernières lignes du log SDK :"
tail -n 20 logs/fail.log

echo -e "\n🔍 Interprétation :"
if grep -q "INDEX | vérification OK" logs/fail.log; then
  echo "✅ Token accepté par index.php"
elif grep -q "INDEX | rejet SDK" logs/fail.log; then
  echo "❌ Token rejeté par index.php"
elif grep -q "INDEX | token reçu" logs/fail.log; then
  echo "⚠️ Token reçu mais pas validé"
else
  echo "❓ Aucun verdict clair dans les logs"
fi
