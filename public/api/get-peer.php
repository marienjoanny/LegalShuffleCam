<?php
// Désactiver l'affichage des erreurs pour éviter de corrompre la réponse JSON
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(E_ALL);

// S'assurer que le Content-Type est JSON
header('Content-Type: application/json');

$callerId = $_GET['callerId'] ?? null;
$file = '/tmp/peers.json';

// --- Fonction utilitaire pour renvoyer le JSON et quitter ---
function jsonResponse($data) {
    echo json_encode($data);
    exit;
}

// 1. Lire les peers, ou initialiser un tableau vide.
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

if ($peers === null) {
    // Si la lecture ou le décodage du JSON a échoué (fichier corrompu)
    $peers = [];
}

$now = time();

// 2. Filtrer pour garder uniquement les sessions actives (maintenant 600s)
$peers = array_filter($peers, fn($ts) => $now - $ts < 600);

// 3. Sauvegarder l'état nettoyé de l'annuaire.
// Si l'écriture échoue, on continue mais on ne renvoie pas d'erreur HTML.
@file_put_contents($file, json_encode($peers));

// 4. Déterminer les pairs disponibles
$available = array_keys($peers);

// Filtrer pour exclure l'appelant lui-même
$available = array_filter($available, fn($id) => $id !== $callerId);

// 5. Gérer le cas sans interlocuteur
if (empty($available)) {
  jsonResponse(['partnerId' => null, 'message' => 'No available peer']);
}

// 6. Sélectionner un ID aléatoire et répondre
$partnerId = $available[array_rand($available)];
jsonResponse(['partnerId' => $partnerId]);

// En cas de sortie inattendue, ne rien envoyer après le JSON
?>
