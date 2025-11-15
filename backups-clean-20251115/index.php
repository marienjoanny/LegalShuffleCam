<?php
// ==========================================
// LegalShuffleCam — Page d'entrée principale
// ==========================================

$logDir = __DIR__ . '/logs';
if (!is_dir($logDir)) {
    @mkdir($logDir, 0775, true);
}
$logFile = $logDir . '/index.log';

function logmsg($msg) {
    global $logFile;
    file_put_contents($logFile, date('c') . " | " . $msg . "\n", FILE_APPEND);
}

// --- 1. Cas retour depuis Go.cam ---
if (isset($_GET["src"]) && $_GET["src"] === "linkback") {
    $ttlDays = 30;
    $expires = time() + $ttlDays * 86400;

    // Secure seulement si HTTPS actif
    $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

    setcookie("age_verified", "1", [
        "expires"  => $expires,
        "path"     => "/",
        "secure"   => $isSecure,
        "httponly" => true,
        "samesite" => "Lax",
    ]);

    logmsg("linkback reçu depuis Go.cam — cookie posé (secure=$isSecure)");

    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Pragma: no-cache");
    header("Location: /", true, 302);
    exit;
}

// --- 2. Si le cookie est déjà présent, on passe à la vraie app ---
if (isset($_COOKIE["age_verified"]) && $_COOKIE["age_verified"] === "1") {
    logmsg("cookie détecté → redirection vers index-real.php");
    header("Location: /index-real.php", true, 302);
    exit;
}

// --- 3. Sinon, lancer la vérification AVS ---
require_once __DIR__ . '/avsPhpSdkV1.php';
require_once dirname(__DIR__) . '/config.php';

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
    if (!$url) {
        throw new Exception('URL Go.cam vide');
    }

    logmsg("initialisation AVS réussie → redirection Go.cam prête");
    header('Content-Type: text/html; charset=UTF-8');

} catch (Throwable $e) {
    logmsg("ERREUR: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo "EXCEPTION: ".$e->getMessage()."\n";
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
    :root{color-scheme:dark light}
    html,body{height:100%}
    body{margin:0;background:#0b1220;color:#e6e8ee;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif;display:flex;align-items:center;justify-content:center;flex-direction:column}
    .box{max-width:740px;width:92vw;background:#111827;border:1px solid #1f2937;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.35);padding:22px;margin-bottom:20px}
    a.btn{display:inline-block;margin-top:14px;padding:10px 14px;border:1px solid #334155;border-radius:10px;color:#e6e8ee;text-decoration:none}
    p{opacity:.9}
    footer{font-size:0.9em;opacity:.6;text-align:center;margin-top:20px}
  </style>
  <script>
    (function(){
      var go = <?php echo json_encode($url, JSON_UNESCAPED_SLASHES); ?>;
      setTimeout(function(){
        try { window.top.location.replace(go); } catch(e) { location.href = go; }
      }, 5000);
    })();
  </script>
<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/tracking-min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/data/face-min.js"></script>
</head>
<body>
  <div class="box">
    <h1>Vérification d’âge</h1>
    <p>Redirection vers Go.cam dans 5 secondes…</p>
    <a class="btn" href="<?php echo htmlspecialchars($url, ENT_QUOTES); ?>">Lancer la vérification Go.cam</a>
  </div>
  <footer>
    <a href="/mentions-legales.html">Mentions légales</a> · 
    <a href="/cgu.html">CGU</a>
  </footer>
<script>

const tracker = new tracking.ObjectTracker("face");

tracker.setInitialScale(2);

tracker.setStepSize(1.5);

tracker.setEdgesDensity(0.05);

tracking.track("#webcam", tracker, { camera: true });

const history = Array(30).fill(0);

tracker.on("track", event => {

  const detected = event.data.length > 0 ? 1 : 0;

  history.shift(); history.push(detected);

  const sum = history.reduce((a,b)=>a+b,0);

  document.getElementById("status").textContent = sum >= 15 ? "✅ Détecte" : "❌ Détecte pas";

});

</script>
</body>
</html>
