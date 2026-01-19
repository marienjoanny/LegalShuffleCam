<?php
// /public/api/get-peer.php
header('Content-Type: application/json');
require_once __DIR__ . '/log_activity.php';

$excludeId = $_GET['exclude'] ?? null;
$peerId = $_GET['peerId'] ?? null;
$annuairePath = PEER_IP_ANNUAIRE; 

$peersData = [];
if (file_exists($annuairePath)) {
    $content = @file_get_contents($annuairePath);
    $peersData = json_decode($content, true) ?: [];
}

$now = time();

// --- LOGIQUE DE MATCHMAKING (Bouton Suivant) ---
if ($excludeId) {
    $potentialMatches = [];
    foreach ($peersData as $id => $data) {
        // Supporte les deux formats de clés pour éviter les conflits
        $lastSeen = $data['timestamp'] ?? $data['ts'] ?? 0;
        
        // Critère : Pas moi-même ET actif depuis moins de 10 minutes (600s)
        if ($id !== $excludeId && ($now - $lastSeen < 600)) {
            $potentialMatches[] = $id;
        }
    }

    if (!empty($potentialMatches)) {
        $randomId = $potentialMatches[array_rand($potentialMatches)];
        echo json_encode([
            'status' => 'found',
            'peerIdToCall' => $randomId 
        ]);
    } else {
        echo json_encode(['status' => 'empty', 'message' => 'Aucun partenaire disponible']);
    }
    exit;
}

// --- LOGIQUE DE CONSULTATION (Appel direct / Admin) ---
if ($peerId) {
    if (isset($peersData[$peerId])) {
        echo json_encode(array_merge(['status' => 'found', 'peerId' => $peerId], $peersData[$peerId]));
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'not_found']);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Parametre manquant']);
