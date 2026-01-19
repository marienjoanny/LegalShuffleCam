<?php
// /public/api/remove-peer.php
/**
 * Supprime explicitement un PeerID de l'annuaire IP temporaire.
 * Ce script est destiné aux outils d'administration.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging et la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
$peerId = $_REQUEST['peerId'] ?? null;
$reason = $_REQUEST['reason'] ?? 'Suppression manuelle/admin'; 

if (!$peerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
    exit;
}

// 🔔 Récupérer l'IP du client effectuant la suppression
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'N/A';
$annuairePath = PEER_IP_ANNUAIRE;

// ----------------------------------------------------
// 1. Suppression de l'entrée dans l'annuaire IP
// ----------------------------------------------------
$peersData = [];
$peerIPRemoved = 'N/A';

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
    $peerIPRemoved = $peersData[$peerId]['ip'] ?? 'N/A'; // On récupère l'IP AVANT de la supprimer
    unset($peersData[$peerId]); // Suppression
    $status = 'removed';
    
    // Réécriture de l'annuaire sans l'entrée du pair
    $jsonContent = json_encode($peersData, JSON_PRETTY_PRINT);
    if (@file_put_contents($annuairePath, $jsonContent, LOCK_EX) === false) {
        logActivity('ERROR', 'ADMIN_TOOL', $peerId, "Échec de la réécriture de l'annuaire IP après suppression.", $clientIP);
        $status = 'error_rewrite';
    }
}

// ----------------------------------------------------
// 2. LOGGING de la suppression (par l'outil d'administration)
// ----------------------------------------------------
logActivity('PEER_REMOVE', 'ADMIN_TOOL', $peerId, "PeerID supprimé de l'annuaire. Raison: {$reason}. IP archivée: {$peerIPRemoved}", $clientIP);


// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
echo json_encode([
    'status' => $status, 
    'peerId' => $peerId, 
    'reason' => $reason,
    'message' => "Peer {$peerId} successfully removed or was not found."
]);
?>
