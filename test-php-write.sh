#!/bin/bash
echo "🧪 Création et exécution de test-php-write.php"

TARGET="/var/www/legalshufflecam/public/test-php-write.php"
LOG="/var/www/legalshufflecam/logs/test.log"

cat <<'PHP' > "$TARGET"
<?php
$log = dirname(__DIR__) . '/logs/test.log';
$result = file_put_contents($log, date('c') . " | test\n", FILE_APPEND);
echo $result ? "✅ Écriture réussie" : "❌ Échec d’écriture";
?>
PHP

chmod 644 "$TARGET"
echo "➡️ Appel via curl :"
curl -k https://localhost/test-php-write.php

echo -e "\n📜 Contenu du log :"
tail -n 5 "$LOG" 2>/dev/null || echo "❌ Aucun log écrit"

echo "✅ Test terminé"
