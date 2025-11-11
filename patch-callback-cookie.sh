#!/bin/bash
echo "🔧 Injection du callback Go.cam avec cookie et logs"

TARGET="public/callback.php"
BACKUP="${TARGET}.pre-cookie-patch.bak"

# Sauvegarde avant modification
cp "$TARGET" "$BACKUP"
echo "🗂️  Backup enregistré : $BACKUP"

# Injection du contenu
cat <<'PHP' > "$TARGET"
<?php
require_once(__DIR__ . '/avsPhpSdkV1.php');
require_once(__DIR__ . '/../config.php'); // charge $config['cipherKey'] et $config['hmacKey']

date_default_timezone_set('Europe/Paris');
file_put_contents(__DIR__ . '/../logs/fail.log', date("c") . " | CALLBACK | reçu\n", FILE_APPEND);

$token = $_POST['d'] ?? '';
if (!$token) {
    file_put_contents(__DIR__ . '/../logs/fail.log', date("c") . " | CALLBACK | token manquant\n", FILE_APPEND);
    http_response_code(400);
    echo "❌ Token manquant";
    exit;
}

$sdk = new AvsPhpSdkV1(592, $config['cipherKey'], $config['hmacKey']);

if ($sdk->fromPayload($token)) {
    setcookie('age_verified', '1', time() + 3600, '/', '', false, true);
    file_put_contents(__DIR__ . '/../logs/fail.log', date("c") . " | CALLBACK | vérification OK\n", FILE_APPEND);
    echo "✅ Vérification réussie";
} else {
    file_put_contents(__DIR__ . '/../logs/fail.log', date("c") . " | CALLBACK | rejet SDK\n", FILE_APPEND);
    http_response_code(403);
    echo "❌ Échec de vérification";
}
?>
PHP

echo "✅ callback.php patché avec cookie et traçage SDK"
