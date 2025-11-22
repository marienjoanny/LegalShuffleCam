<?php
// /public/api/unregister-peer.php
/**
 * Ce point d'API est appelé lorsqu'un utilisateur se déconnecte, 
 * ou lorsqu'un timeout est détecté (cleanup).
 * Il retire le pair de l'annuaire IP temporaire.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging et la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
$peerId = $_REQUEST['peerId'] ?? null;
$sessionId = $_REQUEST['sessionId'] ?? 'UNKNOWN_SESSION_ID'; 
$reason = $_REQUEST['reason'] ?? 'Déconnexion volontaire/standard'; 

if (!$peerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
    exit;
}

// 🔔 Récupérer l'adresse IP pour le log (puisqu'on va la supprimer)
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';
$annuairePath = PEER_IP_ANNUAIRE;


// ----------------------------------------------------
// 1. LOGGING de la déconnexion
// ----------------------------------------------------
logActivity('UNREGISTER', $peerId, 'N/A', "PeerID retiré de l'annuaire. Cause: {$reason}. Session: {$sessionId}", $ipAddress);


// ----------------------------------------------------
// 2. Suppression de l'entrée dans l'annuaire IP
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

$status = 'not_found';
if (isset($peersData[$peerId])) {
    unset($peersData[$peerId]); // Suppression
    $status = 'removed';
    
    // Réécriture de l'annuaire sans l'entrée du pair
    $jsonContent = json_encode($peersData, JSON_PRETTY_PRINT);
    if (@file_put_contents($annuairePath, $jsonContent, LOCK_EX) === false) {
        logActivity('ERROR', $peerId, 'N/A', "Échec de la réécriture de l'annuaire IP après suppression.", $ipAddress);
        $status = 'error_rewrite';
    }
}

// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
echo json_encode([
    'status' => $status, 
    'peerId' => $peerId, 
    'message' => "Peer {$peerId} successfully unregistered or was not found."
]);
?>
