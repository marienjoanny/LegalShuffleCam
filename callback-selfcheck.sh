#!/bin/bash
echo "🧪 Test du callback Go.cam (POST simulé)"

URL="https://localhost/avs/callback"
FAKE_PAYLOAD="d=fakepayload"

echo "➡️ Envoi d’un faux payload POST à $URL"
curl -s -X POST -d "$FAKE_PAYLOAD" -i "$URL"

echo -e "\n📜 Dernière ligne du log success :"
tail -n 1 /var/log/legalshufflecam-success.log 2>/dev/null || echo "Aucune entrée."

echo -e "\n📜 Dernière ligne du log fail :"
tail -n 1 /var/log/legalshufflecam-fail.log 2>/dev/null || echo "Aucune entrée."
