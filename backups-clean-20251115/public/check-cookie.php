<?php
header("Content-Type: text/plain");

echo "🧪 Test du cookie age_verified\n";
echo "-----------------------------\n";

if (isset($_COOKIE["age_verified"])) {
    echo "✅ Cookie détecté : age_verified = " . $_COOKIE["age_verified"] . "\n";
} else {
    echo "❌ Cookie absent\n";
}

echo "\n📡 IP : " . ($_SERVER["REMOTE_ADDR"] ?? "inconnue") . "\n";
echo "🧭 User-Agent : " . ($_SERVER["HTTP_USER_AGENT"] ?? "non fourni") . "\n";
?>
