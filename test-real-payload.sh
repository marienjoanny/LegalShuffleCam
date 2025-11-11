#!/bin/bash
echo "🔐 Test avec payload réel Go.cam → callback → cookie → index.php"

CALLBACK_URL="https://localhost/avs/callback"
INDEX_URL="https://localhost/"
INDEX_REAL_URL="https://localhost/index-real.php"
LOG_SUCCESS="/var/www/legalshufflecam/logs/success.log"
LOG_FAIL="/var/www/legalshufflecam/logs/fail.log"

# Remplace ici par ton vrai token Go.cam
REAL_PAYLOAD="SANzeeE-EnKQDQH0eAhuXXz9uYc45Ad7w80ea5-ZXhKoN2MbCkDDaM8NyE10Ot-5Z6oJe7yHHNkjRrB9kKD85RBHCP8a31lQy4dsEMJJvrX7wT6sxaTvlFm1UNh5Eqp3sFBfv6Uvmq2VWZXzMDvrJrCeinQoDqUvCHLJBglw8I6S6t_ZefQiGFeA8TUqGw4jQ4SFSTxAt24BlRJe_G_ho7051I_2YaeJdPlbsbRrm1iur6jlZsAPi2pedQ_qA4nq0RgFl7b1flnGXhjmiu26Fg"

echo "➡️ Envoi du payload réel vers callback.php"
curl -k -X POST -d "d=$REAL_PAYLOAD" -c cookies.txt "$CALLBACK_URL"

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

echo "✅ Test avec payload réel terminé"
