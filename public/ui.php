<?php
session_start();

// Vérification d'âge : on suppose qu'une variable de session "age_verified" est définie
if (!isset($_SESSION['age_verified']) || $_SESSION['age_verified'] !== true) {
    // Si l'âge n'est pas validé, on redirige vers une page de contrôle
    header("Location: age-check.php");
    exit();
}

// Si l'âge est validé, on redirige vers l'interface principale
header("Location: /public/index.php");
exit();
?>
