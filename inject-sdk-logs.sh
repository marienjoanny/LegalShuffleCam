#!/bin/bash
echo "🛠️ Injection de logs dans fromPayload() sans toucher au reste du SDK"

SDK="/var/www/legalshufflecam/public/avsPhpSdkV1.php"
BACKUP="${SDK}.pre-log-injection.bak"

cp "$SDK" "$BACKUP"
echo "📦 Backup enregistré : $BACKUP"

LOG_LINE='file_put_contents("/var/www/legalshufflecam/logs/fail.log", date("c") . " | SDK | rejection point reached\n", FILE_APPEND);'

# Inject juste avant chaque return false dans fromPayload()
awk '
  /function fromPayload\(/ { in_func=1 }
  in_func && /return false;/ {
    print "'"$LOG_LINE"'"
    print
    next
  }
  /function / && !/fromPayload/ { in_func=0 }
  { print }
' "$BACKUP" > "$SDK"

echo "✅ Logs injectés dans fromPayload()"
