<?php
// /public/api/report-handler.php
header('Content-Type: application/json');

// Inclure le logger général
require_once __DIR__ . '/log_activity.php'; 

// Le répertoire de stockage des rapports détaillés
const REPORT_DIR = '/var/www/legalshufflecam/public/api/logs/reports'; 

// 🔔 NOUVEAU: L'emplacement où register-peer.php stocke l'annuaire IP/TS
const PEER_IP_ANNUAIRE = '/tmp/peers.json';

// Récupération des données POST
$reporterId = $_POST['callerId'] ?? null;
$reportedId = $_POST['partnerId'] ?? null;
$reason = $_POST['reason'] ?? 'Raison non spécifiée';
$imageBase64 = $_POST['imageBase64'] ?? '';
$sessionId = $_POST['sessionId'] ?? uniqid('session_'); 

if (!$reporterId || !$reportedId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing ID (callerId or partnerId)']);
    exit;
}

// --- NOUVEAU: Récupération de l'IP du signalé ---
$reportedIP = 'NOT_FOUND_IN_ANNUAIRE';

if (file_exists(PEER_IP_ANNUAIRE)) {
    $peersData = json_decode(file_get_contents(PEER_IP_ANNUAIRE), true);
    
    // Recherchez l'IP dans l'annuaire en utilisant l'ID signalé.
    // La structure est maintenant: [peerId => ['ts' => X, 'ip' => Y]]
    if (isset($peersData[$reportedId]['ip'])) {
        $reportedIP = $peersData[$reportedId]['ip'];
    }
}
// --------------------------------------------------

// 1. Préparation des données du rapport
$reportData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'reporterId' => $reporterId,
    'reportedId' => $reportedId,
    'reporterIP' => $_SERVER['REMOTE_ADDR'] ?? 'N/A', // IP de celui qui signale
    'reportedIP' => $reportedIP,                      // 🚨 IP de celui qui est signalé (RÉCUPÉRÉE)
    'reason' => $reason,
    'sessionId' => $sessionId,
    'imageBase64_data' => !empty($imageBase64) ? 'Present (base64)' : 'None' // On note la présence, on n'affiche pas la donnée brute ici
];

// 2. Écriture du fichier JSON du rapport détaillé
$filename = REPORT_DIR . '/' . time() . '_' . $reportedId . '.json'; // Utiliser l'ID signalé dans le nom du fichier

if (!is_dir(REPORT_DIR)) {
    @mkdir(REPORT_DIR, 0777, true);
}

@file_put_contents($filename, json_encode($reportData, JSON_PRETTY_PRINT));

// 3. Log général (pour la traçabilité dans activity.log)
logActivity('REPORT', $reporterId, $reportedId, $reason, $reportedIP); // Ajout de l'IP du signalé au log général

echo json_encode(['status' => 'success', 'message' => 'Signalement enregistré avec IP du signalé: ' . $reportedIP]);
?>
