#!/bin/bash
echo "🧪 Test du retour Go.cam via ?src=linkback"

URL="https://localhost/index.php?src=linkback"

# Appel avec suivi de redirection
curl -s -k -L -c cookies.txt -D headers.txt "$URL" > /dev/null

echo -e "\n🍪 Vérification du cookie reçu :"
if grep -q age_verified cookies.txt; then
  echo "✅ Cookie age_verified présent"
else
  echo "❌ Cookie age_verified absent"
fi

echo -e "\n📍 Vérification de la redirection finale :"
FINAL=$(grep -i '^location:' headers.txt | tail -n1 | awk '{print $2}' | tr -d '\r')
if [[ "$FINAL" == "/index-real.php" ]]; then
  echo "✅ Redirection correcte vers /index-real.php"
else
  echo "❌ Redirection inattendue : $FINAL"
fi

echo -e "\n📜 Dernières lignes du log SDK :"
tail -n 20 logs/fail.log

echo -e "\n🔍 Interprétation :"
if grep -q "src=linkback" headers.txt && grep -q "age_verified" cookies.txt; then
  echo "✅ Retour Go.cam traité avec succès"
else
  echo "⚠️  Retour partiel ou incomplet"
fi
