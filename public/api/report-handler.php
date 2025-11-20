<?php
// /public/api/report-handler.php
header('Content-Type: application/json');

// Inclure le logger général
require_once __DIR__ . '/log_activity.php'; 

// --- CHEMINS ---

// CHEMIN CRUCIAL CORRIGÉ : Les rapports sont désormais écrits dans la file d'attente.
const REPORT_PENDING_DIR = __DIR__ . '/../../logs/reports/pending_review'; 
const REPORT_IMAGES_DIR = __DIR__ . '/../../logs/reports/images'; // Nouveau dossier pour les images
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

// 1. Gestion de l'IP du signalé (via annuaire)
$reportedIP = 'NOT_FOUND_IN_ANNUAIRE';

if (file_exists(PEER_IP_ANNUAIRE)) {
    $peersData = json_decode(file_get_contents(PEER_IP_ANNUAIRE), true);
    
    if (isset($peersData[$reportedId]['ip'])) {
        $reportedIP = $peersData[$reportedId]['ip'];
    }
}

// 2. Préparation des dossiers de rapports et d'images
if (!is_dir(REPORT_PENDING_DIR)) {
    if (!@mkdir(REPORT_PENDING_DIR, 0775, true)) {
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Failed to create report directory.', 'path' => REPORT_PENDING_DIR]);
        exit;
    }
}
if (!is_dir(REPORT_IMAGES_DIR)) {
     @mkdir(REPORT_IMAGES_DIR, 0775, true);
}


// --- 3. SAUVEGARDE DE LA CAPTURE D'ÉCRAN ---
$imageFilename = 'None';
$reportTimestamp = time();

if (!empty($imageBase64)) {
    // Décodage de la Base64: on enlève le préfixe (data:image/png;base64,) si présent
    $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imageBase64));
    
    // Nom du fichier image: timestamp_reportedId.png
    $imageFilename = $reportTimestamp . '_' . $reportedId . '.png';
    // L'image va dans un dossier séparé 'images'
    $imagePath = REPORT_IMAGES_DIR . '/' . $imageFilename;

    if (@file_put_contents($imagePath, $imageData) === false) {
        logActivity('REPORT_ERROR', $reporterId, $reportedId, "Failed to save screenshot at: " . $imagePath, $reportedIP);
        $imageFilename = 'Failed to save screenshot';
    } else {
        logActivity('REPORT_INFO', $reporterId, $reportedId, "Screenshot saved: " . $imageFilename, $reportedIP);
    }
}


// 4. Préparation et Écriture du fichier JSON du rapport détaillé
$reportData = [
    'timestamp' => date('Y-m-d H:i:s', $reportTimestamp),
    'reporterId' => $reporterId,
    'reportedId' => $reportedId,
    'reporterIP' => $_SERVER['REMOTE_ADDR'] ?? 'N/A', 
    'reportedIP' => $reportedIP,                      
    'reason' => $reason,
    'sessionId' => $sessionId,
    'screenshotFile' => $imageFilename // Référence au nom de fichier image
];

// Nom du fichier JSON: timestamp_reportedId.json
$jsonFilename = $reportTimestamp . '_' . $reportedId . '.json';
// Écrit dans le dossier PENDING_REVIEW
$jsonPath = REPORT_PENDING_DIR . '/' . $jsonFilename;

if (@file_put_contents($jsonPath, json_encode($reportData, JSON_PRETTY_PRINT)) === false) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to write report file (Permissions?).', 'path' => $jsonPath]);
    exit;
}

// 5. Log général (pour la traçabilité dans activity.log)
logActivity('REPORT', $reporterId, $reportedId, $reason, $reportedIP); 

echo json_encode(['status' => 'success', 'message' => 'Signalement enregistré avec capture d\'écran: ' . $imageFilename]);