<?php
require_once dirname(__DIR__) . '/config.php';

header("Content-Type: text/plain");

echo "🔍 Contenu de \$avsConfig :\n\n";
var_export($avsConfig);
echo "\n\n";

foreach (['partnerId', 'cipherKey', 'hmacKey'] as $key) {
    if (!isset($avsConfig[$key])) {
        echo "❌ Clé absente : $key\n";
    } else {
        echo "✅ Clé présente : $key\n";
    }
}
