<?php
header('Content-Type: application/json');

$callerId = $_GET['callerId'] ?? null;
$file = '/tmp/peers.json';

// Lire les peers, ou initialiser un tableau vide.
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

$now = time();

// Filtrer pour garder uniquement les sessions actives (maintenant 600s pour cohérence)
$peers = array_filter($peers, fn($ts) => $now - $ts < 600); // CORRIGÉ : max 600s (10 min)

// IMPORTANT : Sauvegarder l'état nettoyé de l'annuaire.
// Bien que register-peer.php le fasse, c'est mieux si tous les scripts le font
// pour garantir que le fichier peers.json ne grossisse pas inutilement.
file_put_contents($file, json_encode($peers));

$available = array_keys($peers);

// Filtrer pour exclure l'appelant lui-même
$available = array_filter($available, fn($id) => $id !== $callerId);

if (empty($available)) {
  // Changement pour utiliser 'partnerId' null comme dans votre match.js
  echo json_encode(['partnerId' => null, 'message' => 'No available peer']);
  exit;
}

// Sélectionner un ID aléatoire
$partnerId = $available[array_rand($available)];
echo json_encode(['partnerId' => $partnerId]);
?>
