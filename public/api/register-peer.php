<?php
header('Content-Type: application/json');
require_once __DIR__ . '/log_activity.php';

// Lecture du flux JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Supporte le JSON (JS) ou le $_REQUEST (Formulaire/URL)
$peerId = $data['peerId'] ?? $_REQUEST['peerId'] ?? null;
$sessionId = $data['sessionId'] ?? $_REQUEST['sessionId'] ?? 'UNKNOWN_SESSION_ID';

if (!$peerId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing peerId']);
    exit;
}

$ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

// Mise à jour de l'annuaire dans /tmp/peers.json
updatePeerAnnuaire($peerId, $ipAddress, $sessionId);

// Log de l'activité
logActivity('REGISTER', $peerId, 'N/A', "PeerID enregistré via API.", $ipAddress);

echo json_encode([
    'status' => 'registered', 
    'peerId' => $peerId, 
    'ip' => $ipAddress,
    'source' => ($data ? 'json' : 'request')
]);
?>
