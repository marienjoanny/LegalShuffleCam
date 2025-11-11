<?php
// ✅ Réinitialisation manuelle
if (isset($_GET["reset"])) {
    setcookie("age_verified", "", [
        "expires"  => time() - 3600,
        "path"     => "/",
        "domain"   => ".legalshufflecam.ovh",
        "secure"   => true,
        "httponly" => false,
        "samesite" => "None"
    ]);
    file_put_contents(__DIR__ . "/avs-debug.log", "[".date("Y-m-d H:i:s")."] Cookie supprimé via reset IP=" . ($_SERVER["REMOTE_ADDR"] ?? "N/A") . " UA=" . ($_SERVER["HTTP_USER_AGENT"] ?? "N/A") . "\n", FILE_APPEND);
    echo "<p>Cookie supprimé. <a href='/'>Revenir à l’accueil</a></p>";
    exit;
}

// ✅ Retour depuis Go.cam → pose du cookie avec options explicites
$src = $_GET["src"] ?? $_GET["\\src"] ?? $_POST["src"] ?? $_POST["\\src"] ?? null;
if ($src === "linkback") {
    setcookie("age_verified", "1", [
        "expires"  => time() + 86400 * 30,
        "path"     => "/",
        "domain"   => ".legalshufflecam.ovh",
        "secure"   => true,
        "httponly" => false,
        "samesite" => "None"
    ]);
    file_put_contents(__DIR__ . "/avs-debug.log", "[".date("Y-m-d H:i:s")."] Cookie posé via linkback IP=" . ($_SERVER["REMOTE_ADDR"] ?? "N/A") . " UA=" . ($_SERVER["HTTP_USER_AGENT"] ?? "N/A") . "\n", FILE_APPEND);
    echo "<p>✅ Cookie posé avec SameSite=None. <a href='/'>Revenir à l’accueil</a></p>";
    echo "<p><a href='/test-cookie.php'>🔍 Vérifier le cookie via test-cookie.php</a></p>";
    echo "<p><a href='/log-cookie.php'>📋 Journaliser et afficher le cookie</a></p>";
    exit;
}

// ✅ Lecture du cookie → log explicite
file_put_contents(__DIR__ . "/avs-debug.log", "[".date("Y-m-d H:i:s")."] Vérif cookie présent ? " . json_encode($_COOKIE) . " IP=" . ($_SERVER["REMOTE_ADDR"] ?? "N/A") . " UA=" . ($_SERVER["HTTP_USER_AGENT"] ?? "N/A") . "\n", FILE_APPEND);

// ✅ Redirection si déjà vérifié
if (isset($_COOKIE["age_verified"]) && $_COOKIE["age_verified"] === "1") {
    file_put_contents(__DIR__ . "/avs-debug.log", "[".date("Y-m-d H:i:s")."] Cookie détecté → redirection vers index-real.php\n", FILE_APPEND);
    header("Location: /index-real.php", true, 302);
    exit;
}

// ✅ Appel SDK Go.cam
require_once __DIR__ . '/avsPhpSdkV1.php';
require_once dirname(__DIR__) . '/config.php';

global $config;

$avs = new AvsPhpSdkV1(
    $config['partnerId'],
    $config['cipherKey'],
    $config['hmacKey']
);

$avs->fillRequest([
    'userData' => ['userId' => 0],
    'http' => [
        'userAgent'       => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown-UA',
        'websiteHostname' => $_SERVER['SERVER_NAME'] ?? 'legalshufflecam.ovh',
    ],
    'ipStr'    => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1',
    'linkBack' => 'https://legalshufflecam.ovh/?src=linkback',
]);

$url = $avs->toUrl();
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Vérification d’âge</title>
</head>
<body>
  <h1>Vérification d’âge</h1>
  <p>Veuillez cliquer pour lancer la vérification :</p>
  <a href="<?php echo htmlspecialchars($url, ENT_QUOTES); ?>">Lancer la vérification</a>
  <p><a href="/?reset=1">🧹 Réinitialiser le cookie</a></p>
  <p><a href="/test-cookie.php">🔍 Vérifier le cookie via test-cookie.php</a></p>
  <p><a href="/log-cookie.php">📋 Journaliser et afficher le cookie</a></p>
  <hr>
  <pre>
  $_GET: <?php print_r($_GET); ?>

  $_POST: <?php print_r($_POST); ?>

  $_COOKIE: <?php print_r($_COOKIE); ?>

  $_SERVER: <?php print_r([
    'HTTP_USER_AGENT' => $_SERVER['HTTP_USER_AGENT'] ?? '',
    'SERVER_NAME'     => $_SERVER['SERVER_NAME'] ?? '',
    'REMOTE_ADDR'     => $_SERVER['REMOTE_ADDR'] ?? '',
  ]); ?>
  </pre>
<!-- 🧪 Bouton de test de signalement -->

<button id="simulateReportBtn">📩 Simuler un signalement</button>

<p id="status"></p>

<script>

document.getElementById("simulateReportBtn").addEventListener("click", () => {

  fetch("/api/report", {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify({

      remoteId: "simu-browser",

      reason: "test depuis navigateur",

      image: "data:image/jpeg;base64,TESTBASE64",

      reporterId: "admin",

      sessionId: "session-browser",

      ip: "127.0.0.1"

    })

  })

  .then(res => {

    const status = document.getElementById("status");

    if (res.ok) {

      status.textContent = "✅ Signalement simulé avec succès !";

      status.style.color = "green";

    } else {

      status.textContent = "❌ Échec du signalement : " + res.status;

      status.style.color = "red";

    }

  })

  .catch(err => {

    console.error("Erreur réseau :", err);

    document.getElementById("status").textContent = "❌ Erreur réseau";

  });

});

</script>
</body>
</html>
