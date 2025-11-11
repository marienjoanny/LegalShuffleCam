#!/bin/bash
echo "🛠️ Patch du SDK pour traçage complet dans fromPayload()"

SDK="/var/www/legalshufflecam/public/avsPhpSdkV1.php"
BACKUP="${SDK}.pre-decrypt-dump.bak"

cp "$SDK" "$BACKUP"
echo "📦 Backup enregistré : $BACKUP"

# Injecte des logs dans fromPayload()
sed -i '/function fromPayload/,/return true;/ {
  /base64_decode/ a\\
    file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | base64 decoded length: " . strlen($payloadBase64) . "\\n", FILE_APPEND);
  /openssl_decrypt/ a\\
    file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | decrypted buffer: " . $output . "\\n", FILE_APPEND);
  /json_decode/ a\\
    file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | json raw: " . $output . "\\n", FILE_APPEND);
  /return false;/ i\\
    file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | rejection point reached\\n", FILE_APPEND);
}' "$SDK"

echo "✅ SDK patché avec traçage decrypt/json"
