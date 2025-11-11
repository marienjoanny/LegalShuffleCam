#!/bin/bash
echo "🧨 Création de index.php avec logique Go.cam"

cd /var/www/legalshufflecam/public || { echo "❌ Dossier introuvable"; exit 1; }

cat <<'PHP' > index.php
<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$appTarget = "/index-real.php";

// 1. Si cookie présent → redirection directe
if (isset($_COOKIE["age_verified"]) && $_COOKIE["age_verified"] === "1") {
    header("Location: " . $appTarget, true, 302);
    exit;
}

// 2. Si retour client-side Go.cam
if (isset($_GET["src"]) && $_GET["src"] === "linkback") {
    header("Location: " . $appTarget, true, 302);
    exit; 
}

// 3. Sinon → lancer vérification Go.cam
require_once __DIR__ . '/avsPhpSdkV1.php';
require_once dirname(__DIR__) . '/config.php';

global $config;

try {
    $host = $_SERVER['HTTP_HOST'] ?? 'legalshufflecam.ovh';
    $linkBack = "https://" . $host . "/?src=linkback";
    $callback = "https://" . $host . "/avs/callback"; 
    
    $ua   = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown-UA';
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
    if (!$url) {
        throw new Exception('URL Go.cam vide');
    }

    header('Content-Type: text/html; charset=UTF-8');
} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "EXCEPTION PHP FATALE: ".$e->getMessage()."\n";
    exit;
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Vérification d’âge</title>
  <style>
    body{margin:0;background:#0b1220;color:#e6e8ee;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;flex-direction:column}
    .box{max-width:740px;width:92vw;background:#111827;border:1px solid #1f2937;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:22px;margin-bottom:20px}
    a.btn{display:inline-block;margin-top:14px;padding:10px 14px;border:1px solid #334155;border-radius:10px;color:#e6e8ee;text-decoration:none}
    footer{font-size:0.9em;opacity:.6;text-align:center;margin-top:20px}
  </style>
  <script>
    (function(){
      var go = <?php echo json_encode($url ?? '', JSON_UNESCAPED_SLASHES); ?>;
      setTimeout(function(){
        try { window.top.location.replace(go); } catch(e) { location.href = go; }
      }, 5000);
    })();
  </script>
</head>
<body>
  <div class="box">
    <h1>Vérification d’âge</h1>
    <p>Redirection vers Go.cam dans 5 secondes…</p>
    <a class="btn" href="<?php echo htmlspecialchars($url ?? '#', ENT_QUOTES); ?>">Lancer la vérification Go.cam</a>
  </div>
  <footer>
    <a href="/mentions-legales.html">Mentions légales</a> ·
    <a href="/cgu.html">CGU</a>
  </footer>
</body>
</html>
PHP

echo "✅ index.php créé avec logique Go.cam"
