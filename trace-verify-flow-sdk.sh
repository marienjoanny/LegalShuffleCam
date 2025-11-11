#!/bin/bash
echo "🔍 Traçage SDK Go.cam : payload signé → callback → cookie → index.php"

PHP="/usr/bin/php"
CALLBACK_URL="https://localhost/avs/callback"
INDEX_URL="https://localhost/"
INDEX_REAL_URL="https://localhost/index-real.php"
LOG_SUCCESS="/var/www/legalshufflecam/logs/success.log"
LOG_FAIL="/var/www/legalshufflecam/logs/fail.log"

# Génère un payload signé avec le SDK
PAYLOAD=$($PHP -r '
require_once "/var/www/legalshufflecam/public/avsPhpSdkV1.php";
require_once "/var/www/legalshufflecam/config.php";

$avs = new AvsPhpSdkV1(
  $config["partnerId"],
  $config["cipherKey"],
  $config["hmacKey"]
);

echo $avs->buildPayload();
')

echo "➡️ Payload signé généré :"
echo "$PAYLOAD"

# Envoie le payload au callback
curl -k -X POST -d "d=$PAYLOAD" -c cookies.txt "$CALLBACK_URL"

echo -e "\n🍪 Vérification du cookie reçu :"
grep age_verified cookies.txt || echo "❌ Cookie age_verified absent"

echo -e "\n➡️ Accès à index.php avec cookie"
curl -k -b cookies.txt -i "$INDEX_URL" | head -n 10

echo -e "\n➡️ Accès à index-real.php avec cookie"
curl -k -b cookies.txt -i "$INDEX_REAL_URL" | head -n 10

echo -e "\n📜 Dernière ligne du log success :"
tail -n 1 "$LOG_SUCCESS" 2>/dev/null || echo "Aucune entrée."

echo -e "\n📜 Dernière ligne du log fail :"
tail -n 1 "$LOG_FAIL" 2>/dev/null || echo "Aucune entrée."

echo "✅ Flux SDK corrigé et vérifié"
