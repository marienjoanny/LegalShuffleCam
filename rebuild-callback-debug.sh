#!/bin/bash
echo "🧨 Reconstruction complète de callback.php avec logs de debug et vérification SDK"

TARGET="/var/www/legalshufflecam/public/avs/callback.php"
BACKUP="${TARGET}.pre-rebuild.bak"

mkdir -p "$(dirname "$TARGET")"

if [ -f "$TARGET" ]; then
  cp "$TARGET" "$BACKUP"
  echo "📦 Backup enregistré : $BACKUP"
fi

cat <<'PHP' > "$TARGET"
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once dirname(__DIR__) . '/avsPhpSdkV1.php';
require_once dirname(dirname(__DIR__)) . '/config.php';

global $config;

$logSuccess = '/var/log/legalshufflecam-success.log';
$logFail    = '/var/log/legalshufflecam-fail.log';

function logLine($file, $msg) {
    file_put_contents($file, date('c') . ' | ' . $msg . "\n", FILE_APPEND);
}

// Log d’entrée dans le script
logLine($logFail, "ENTRY | callback.php lancé | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));

// 1. Vérifie que la requête est bien POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    logLine($logFail, "FAIL | Method Not Allowed | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: Method Not Allowed";
    exit;
}

// 2. Récupère et valide le payload
$payload = $_POST['d'] ?? null;
logLine($logFail, "DEBUG | Payload brut: " . json_encode($payload));

if (empty($payload)) {
    http_response_code(400);
    logLine($logFail, "FAIL | No Payload | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: No payload.";
    exit;
}

// 3. Initialise le SDK
$avs = new AvsPhpSdkV1(
    $config['partnerId'],
    $config['cipherKey'],
    $config['hmacKey']
);

// 4. Vérifie la signature
$valid = $avs->fromPayload($payload);
logLine($logFail, "DEBUG | Résultat SDK: " . ($valid ? "valide" : "invalide"));

if (!$valid) {
    http_response_code(200);
    logLine($logFail, "FAIL | Invalid Signature | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: Invalid signature.";
    exit;
}

// 5. Pose le cookie
$ttlDays = 30;
$expires = time() + $ttlDays * 86400;

setcookie("age_verified", "1", [
    "expires"  => $expires,
    "path"     => "/",
    "secure"   => true,
    "httponly" => false,
    "samesite" => "None"
]);

logLine($logSuccess, "SUCCESS | Cookie posé | IP: " . ($avs->userIpStr ?? 'N/A'));

http_response_code(200);
echo "OK";
PHP

echo "✅ callback.php reconstruit avec logs de debug"
