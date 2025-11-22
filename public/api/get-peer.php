<?php
// /public/api/get-peer.php
/**
 * Récupère les informations détaillées (IP, SessionId, Timestamp) pour un PeerID donné.
 * Principalement utilisé par les outils d'administration ou les scripts côté serveur.
 */
header('Content-Type: application/json');

// Inclure la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
$peerId = $_GET['peerId'] ?? null;

if (!$peerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
    exit;
}

$annuairePath = PEER_IP_ANNUAIRE;
$peersData = [];

// ----------------------------------------------------
// 1. Lecture de l'annuaire IP
// ----------------------------------------------------
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
// 2. Vérification et Réponse
// ----------------------------------------------------
if (isset($peersData[$peerId])) {
    // Le pair est trouvé, inclut l'ID dans la réponse
    $response = array_merge(['status' => 'found', 'peerId' => $peerId], $peersData[$peerId]);
    echo json_encode($response);
} else {
    // Pair non trouvé
    http_response_code(404);
    echo json_encode(['status' => 'not_found', 'peerId' => $peerId, 'message' => 'Peer ID not found in temporary annuaire.']);
}

// Note: Pas de logActivity ici, c'est une opération de lecture
?>
