#!/bin/bash
echo "🔍 Vérification complète de l’accessibilité du callback Go.cam"

URL_HTTP="http://localhost/avs/callback"
URL_HTTPS="https://localhost/avs/callback"
LOG_SUCCESS="/var/log/legalshufflecam-success.log"
LOG_FAIL="/var/log/legalshufflecam-fail.log"

echo "➡️ Test GET HTTP (doit répondre 405)"
curl -s -o /dev/null -w "%{http_code}\n" "$URL_HTTP"

echo "➡️ Test GET HTTPS (doit répondre 405)"
curl -k -s -o /dev/null -w "%{http_code}\n" "$URL_HTTPS"

echo "➡️ Test POST HTTPS avec payload factice (doit répondre 200)"
curl -k -s -X POST -d "d=fakepayload" -o /dev/null -w "%{http_code}\n" "$URL_HTTPS"

echo "📜 Dernière ligne du log success :"
tail -n 1 "$LOG_SUCCESS" 2>/dev/null || echo "Aucune entrée."

echo "📜 Dernière ligne du log fail :"
tail -n 1 "$LOG_FAIL" 2>/dev/null || echo "Aucune entrée."

echo "🔐 Vérification du certificat SSL (localhost)"
echo | openssl s_client -connect localhost:443 -servername localhost 2>/dev/null | openssl x509 -noout -dates || echo "❌ Certificat SSL non détecté"

echo "✅ Vérification terminée"
