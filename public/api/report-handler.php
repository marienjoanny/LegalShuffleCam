<?php
// /public/api/report-handler.php
header('Content-Type: application/json');

// Inclure le logger général
require_once __DIR__ . '/log_activity.php'; 

// Le répertoire de stockage des rapports détaillés (Doit correspondre à $reportDir dans reports.php)
const REPORT_DIR = '/var/www/legalshufflecam/public/api/logs/reports'; 

// Récupération des données POST
$reporterId = $_POST['callerId'] ?? null;
$reportedId = $_POST['partnerId'] ?? null;
$reason = $_POST['reason'] ?? 'Raison non spécifiée';
$imageBase64 = $_POST['imageBase64'] ?? ''; // Capture d'écran (data:image/jpeg;base64,...)
$sessionId = $_POST['sessionId'] ?? uniqid('session_'); 

if (!$reporterId || !$reportedId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing ID (callerId or partnerId)']);
    exit;
}

// 1. Préparation des données du rapport
$reportData = [
    'timestamp' => date('Y-m-d H:i:s'),
    'reporterId' => $reporterId,
    'reportedId' => $reportedId,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'N/A',
    'reason' => $reason,
    'sessionId' => $sessionId,
    'imageBase64' => $imageBase64 
];

// 2. Écriture du fichier JSON (nom unique pour l'archivage)
$filename = REPORT_DIR . '/' . time() . '_' . $reporterId . '.json';

if (!is_dir(REPORT_DIR)) {
    // Tenter de créer le répertoire si nécessaire
    @mkdir(REPORT_DIR, 0777, true);
}

@file_put_contents($filename, json_encode($reportData, JSON_PRETTY_PRINT));

// 3. Log général (pour la traçabilité dans activity.log)
logActivity('REPORT', $reporterId, $reportedId, $reason);

echo json_encode(['status' => 'success', 'message' => 'Signalement enregistré.']);
?>
