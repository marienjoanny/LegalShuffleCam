#!/bin/bash
echo "🛠️ Injection directe dans fromPayload()"

SDK="/var/www/legalshufflecam/public/avsPhpSdkV1.php"
BACKUP="${SDK}.pre-fromPayload-logs.bak"

cp "$SDK" "$BACKUP"
echo "📦 Backup enregistré : $BACKUP"

# Inject manuellement dans fromPayload()
perl -0777 -i -pe '
  s|(function fromPayload\(\$payloadBase64\) \{.*?)\$buffer = base64_decode\(\$payloadBase64, true\);|$1file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | base64 decoded length: " . strlen($payloadBase64) . "\n", FILE_APPEND);\n    $buffer = base64_decode($payloadBase64, true);|s;

  s|\$output = \\openssl_decrypt\((.*?)\);|file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | decrypted buffer: " . $output . "\n", FILE_APPEND);\n    \$output = \\openssl_decrypt($1);|s;

  s|\$dataList = json_decode\(\$output, true\);|file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | json raw: " . \$output . "\n", FILE_APPEND);\n    \$dataList = json_decode(\$output, true);|s;
' "$SDK"

echo "✅ Logs injectés dans fromPayload()"
