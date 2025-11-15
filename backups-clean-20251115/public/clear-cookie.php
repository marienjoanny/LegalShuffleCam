<?php
setcookie("age_verified", "", [
    "expires" => time() - 3600,
    "path" => "/",
    "secure" => true,
    "httponly" => true,
    "samesite" => "Lax",
]);
echo "Cookie 'age_verified' supprimé. Rechargez la page d'accueil pour relancer Go.cam.";
