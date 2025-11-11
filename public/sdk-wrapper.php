<?php
function generate_go_cam_url(): string {
    $fallback = "https://go.cam/en/token/?p=592&d=staticFallbackToken";

    try {
        require_once __DIR__ . '/avsPhpSdkV1.php';
        require_once dirname(__DIR__) . '/config.php';

        $linkBack = "https://legalshufflecam.ovh/?src=linkback";
        $callback = "https://legalshufflecam.ovh/avs/callback?source=avs";

        $ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown-UA';
        $host = $_SERVER['HTTP_HOST'] ?? 'legalshufflecam.ovh';
        $ip   = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

        $avs = new AvsPhpSdkV1($avsConfig["partnerId"], $avsConfig["cipherKey"], $avsConfig["hmacKey"]);
        $url = $avs->generateUrl($linkBack, $callback, $ua, $host, $ip);

        if (!$url) {
            throw new Exception("URL Go.cam vide");
        }

        log_index("URL Go.cam générée avec succès : $url");
        return $url;
    } catch (Throwable $e) {
        log_index("Erreur SDK : " . $e->getMessage());
        return $fallback;
    }
}
