<?php
require_once __DIR__ . '/avsPhpSdkV1.php';
require_once __DIR__ . '/config.php';

$logf = __DIR__ . "/avs-debug.log";
$cookie = $_COOKIE['age_verified'] ?? '(absent)';

file_put_contents($logf, date('c')." COOKIE: ".$cookie.PHP_EOL, FILE_APPEND);

try {
    $linkBack = "https://legalshufflecam.ovh/?src=linkback";
    $callback = "https://legalshufflecam.ovh/avs/callback?src=callback";

    $ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown-UA';
    $host = $_SERVER['HTTP_HOST'] ?? 'legalshufflecam.ovh';
    $ip   = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    $avs = new AvsPhpSdkV1($config['partnerId'], $config['cipherKey'], $config['hmacKey']);
    $avs->fillRequest([
        'userData' => ['userId' => 12345],
        'http' => [
            'userAgent'       => $ua,
            'websiteHostname' => $host,
        ],
        'ipStr'    => $ip,
        'linkBack' => $linkBack,
        'callback' => $callback,
    ]);

    $url = $avs->toUrl();
    file_put_contents($logf, date('c')." URL: ".$url.PHP_EOL, FILE_APPEND);

    header('Content-Type: text/plain; charset=UTF-8');
    echo "Cookie age_verified: ".$cookie.PHP_EOL;
    echo "URL Go.cam: ".$url.PHP_EOL;

} catch (Throwable $e) {
    http_response_code(500);
    echo "EXCEPTION: ".$e->getMessage()."\n";
}
