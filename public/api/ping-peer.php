<?php
// /public/api/ping-peer.php
/**
 * Ce point d'API est utilisé par le client pour signaler qu'il est toujours actif.
 * Il est CRUCIAL pour garder l'entrée PeerID -> IP fraîche dans l'annuaire temporaire.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging et la gestion de l'annuaire
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
$peerId = $_REQUEST['peerId'] ?? null;
$sessionId = $_REQUEST['sessionId'] ?? 'UNKNOWN_SESSION_ID'; 

if (!$peerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
    exit;
}

// 🔔 Récupérer l'adresse IP réelle de l'utilisateur
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

// ----------------------------------------------------
// 1. Mise à jour de l'annuaire IP pour garder l'entrée PeerID/IP fraîche
// ----------------------------------------------------
updatePeerAnnuaire($peerId, $ipAddress, $sessionId);

// ----------------------------------------------------
// 2. Log de l'activité (pour la traçabilité des pings)
// ----------------------------------------------------
logActivity('PING', $peerId, 'N/A', "PeerID a rafraîchi son IP/Session.", $ipAddress);

// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
echo json_encode(['status' => 'pong', 'peerId' => $peerId, 'timestamp' => time()]);
?>
