#!/bin/bash
echo "🛠️ Injection propre des logs dans fromPayload()"

SDK="/var/www/legalshufflecam/public/avsPhpSdkV1.php"
BACKUP="${SDK}.pre-log-injection.bak"

cp "$SDK" "$BACKUP"
echo "📦 Backup enregistré : $BACKUP"

awk '
  BEGIN {
    log = "file_put_contents(\\"/var/www/legalshufflecam/logs/fail.log\\", date(\\"c\\") . \\" | SDK | rejection point reached\\\\n\\", FILE_APPEND);"
  }
  /function fromPayload\(/ { in_func=1 }
  in_func && /return false;/ {
    print log
    print
    next
  }
  /function / && !/fromPayload/ { in_func=0 }
  { print }
' "$BACKUP" > "$SDK"

echo "✅ Logs injectés proprement dans fromPayload()"
