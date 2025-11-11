#!/bin/bash
echo "🔍 Vérification de l’intégrité du SDK Go.cam"

SDK="public/avsPhpSdkV1.php"
LOG="logs/fail.log"
CALLBACK="avs/callback"
COOKIE="cookies.txt"

echo -e "\n📦 Vérification du fichier SDK : $SDK"
if [ ! -s "$SDK" ]; then
  echo "❌ Le fichier est vide ou absent"
else
  echo "✅ Le fichier existe et contient $(wc -l < "$SDK") lignes"
fi

echo -e "\n📎 Vérification de l’inclusion dans callback.php"
grep -q "$SDK" "$CALLBACK" && echo "✅ SDK inclus dans callback.php" || echo "❌ SDK non inclus"

echo -e "\n📝 Vérification du fichier de log : $LOG"
touch "$LOG"
chmod 666 "$LOG"
echo "✅ Droits d’écriture appliqués"

echo -e "\n🧪 Test d’écriture dans le log"
php -r 'file_put_contents("logs/fail.log", date("c") . " | TEST | ligne de test\n", FILE_APPEND);'
tail -n 1 "$LOG"

echo -e "\n🍪 Vérification du cookie age_verified"
grep age_verified "$COOKIE" || echo "❌ Cookie age_verified absent"

echo -e "\n📜 Dernières lignes du log SDK :"
tail -n 20 "$LOG"
