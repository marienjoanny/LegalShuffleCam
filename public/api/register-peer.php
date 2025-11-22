<?php
// /public/api/register-peer.php
header('Content-Type: application/json');

// Inclure la fonction de logging et la gestion de l'annuaire
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
$peerId = $_REQUEST['peerId'] ?? null;
// IMPORTANT: Le Session ID doit être fourni par le client.
$sessionId = $_REQUEST['sessionId'] ?? 'UNKNOWN_SESSION_ID'; 

if (!$peerId) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
  exit;
}

// 🔔 Récupérer l'adresse IP réelle de l'utilisateur
$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';
$annuairePath = PEER_IP_ANNUAIRE;


/**
 * Purge les entrées de l'annuaire trop vieilles (>10 minutes).
 */
function purgeOldPeers(string $annuairePath, int $maxAgeSeconds = 600) {
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

    $now = time();
    $peersData = array_filter($peersData, function($peerData) use ($now, $maxAgeSeconds) {
        $ts = $peerData['timestamp'] ?? 0; 
        return ($now - $ts) < $maxAgeSeconds;
    });

    // Réécrire l'annuaire purgé
    $jsonContent = json_encode($peersData, JSON_PRETTY_PRINT);
    @file_put_contents($annuairePath, $jsonContent, LOCK_EX);
}


// --- 1. Purge et Mise à Jour de l'Annuaire ---
// La purge est exécutée pour nettoyer les entrées obsolètes.
purgeOldPeers($annuairePath);

// Mise à jour de l'entrée courante avec l'IP, le Session ID et le timestamp via l'utilitaire.
updatePeerAnnuaire($peerId, $ipAddress, $sessionId); 


// --- 2. LOGGING ---
logActivity('REGISTER', $peerId, 'N/A', "PeerID enregistré et IP archivée.", $ipAddress); 


// --- 3. Réponse ---
echo json_encode(['status' => 'registered', 'peerId' => $peerId, 'ip' => $ipAddress, 'sessionId' => $sessionId]);
?>
