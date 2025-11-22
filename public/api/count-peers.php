<?php
// /public/api/count-peers.php
/**
 * Compte le nombre total de pairs actuellement enregistrés dans l'annuaire IP temporaire.
 */
header('Content-Type: application/json');

// Inclure la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

$annuairePath = PEER_IP_ANNUAIRE;

// ----------------------------------------------------
// 1. Lecture de l'annuaire IP
// ----------------------------------------------------
$peersData = [];

if (file_exists($annuairePath)) {
    $content = @file_get_contents($annuairePath);
    if ($content !== false) {
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $peersData = $decoded;
        }
    }
}

// ----------------------------------------------------
// 2. Compter le nombre de pairs
// ----------------------------------------------------
$count = count($peersData);

// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
echo json_encode(['status' => 'success', 'count' => $count, 'timestamp' => time()]);

// Note: Pas de logActivity ici, c'est une opération de lecture fréquente
?>
