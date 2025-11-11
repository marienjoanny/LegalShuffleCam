#!/bin/bash
echo "🔁 Reconstruction de callback.php avec logs dans /var/www/legalshufflecam/logs/"

TARGET="/var/www/legalshufflecam/public/avs/callback.php"
LOGDIR="/var/www/legalshufflecam/logs"
BACKUP="${TARGET}.pre-local-logs.bak"

mkdir -p "$LOGDIR"
touch "$LOGDIR/success.log" "$LOGDIR/fail.log"
chown -R www-data:www-data "$LOGDIR"
chmod 775 "$LOGDIR"
chmod 664 "$LOGDIR/"*.log

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

$logSuccess = dirname(__DIR__) . '/../logs/success.log';
$logFail    = dirname(__DIR__) . '/../logs/fail.log';

function logLine($file, $msg) {
    file_put_contents($file, date('c') . ' | ' . $msg . "\n", FILE_APPEND);
}

logLine($logFail, "ENTRY | callback.php lancé | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    logLine($logFail, "FAIL | Method Not Allowed | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: Method Not Allowed";
    exit;
}

$payload = $_POST['d'] ?? null;
logLine($logFail, "DEBUG | Payload brut: " . json_encode($payload));

if (empty($payload)) {
    http_response_code(400);
    logLine($logFail, "FAIL | No Payload | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: No payload.";
    exit;
}

$avs = new AvsPhpSdkV1(
    $config['partnerId'],
    $config['cipherKey'],
    $config['hmacKey']
);

$valid = $avs->fromPayload($payload);
logLine($logFail, "DEBUG | Résultat SDK: " . ($valid ? "valide" : "invalide"));

if (!$valid) {
    http_response_code(200);
    logLine($logFail, "FAIL | Invalid Signature | IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A'));
    echo "FAIL: Invalid signature.";
    exit;
}

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

echo "✅ callback.php reconstruit avec logs dans logs/"
