<?php
setcookie("age_verified", "1", time() + 86400 * 30, "/");
header("Content-Type: text/plain");
echo "✅ Cookie age_verified posé (réponse HTTP)";
?>
