<?php
// /public/api/report-handler.php
header('Content-Type: application/json');

// Inclure le logger général et l'annuaire IP. 
// Cela importe logActivity(), updatePeerAnnuaire() et la constante PEER_IP_ANNUAIRE.
require_once __DIR__ . '/log_activity.php'; 

// --- CHEMINS ---
const REPORT_PENDING_DIR = __DIR__ . '/../../logs/reports/pending_review'; 
const REPORT_IMAGES_DIR = __DIR__ . '/../../logs/reports/images'; 

// Récupération des données POST
$reporterId = $_POST['callerId'] ?? null;
$reportedId = $_POST['partnerId'] ?? null;
$reason = $_POST['reason'] ?? 'Raison non spécifiée';
$imageBase64 = $_POST['imageBase64'] ?? '';
$sessionId = $_POST['sessionId'] ?? uniqid('session_'); 

// 🔔 Récupérer l'IP du signaleur actuel
$reporterIP = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

if (!$reporterId || !$reportedId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing ID (callerId or partnerId)']);
    exit;
}

// ----------------------------------------------------
// NOUVEAU: 1. Mise à jour de l'annuaire du signaleur (reporter)
// Ceci est CRUCIAL pour archiver l'IP de celui qui signale en temps réel.
// ----------------------------------------------------
updatePeerAnnuaire($reporterId, $reporterIP, $sessionId);


// ----------------------------------------------------
// 2. Gestion de l'IP du signalé (via annuaire)
// ----------------------------------------------------
$reportedIP = 'NOT_FOUND_IN_ANNUAIRE';

// Utilisation de la constante PEER_IP_ANNUAIRE définie dans log_activity.php
if (file_exists(PEER_IP_ANNUAIRE)) {
    // Lecture directe de l'annuaire temporaire
    $peersData = json_decode(@file_get_contents(PEER_IP_ANNUAIRE), true);
    
    // Vérifier l'existence de l'ID et de la clé 'ip'
    if (isset($peersData[$reportedId]['ip'])) {
        $reportedIP = $peersData[$reportedId]['ip'];
    }
}

// 3. Vérification des dossiers de rapports (ils devraient exister, mais on sécurise)
if (!is_dir(REPORT_PENDING_DIR) || !is_dir(REPORT_IMAGES_DIR)) {
     @mkdir(REPORT_PENDING_DIR, 0775, true);
     @mkdir(REPORT_IMAGES_DIR, 0775, true);
}


// --- 4. SAUVEGARDE DE LA CAPTURE D'ÉCRAN ---
$imageFilename = 'None';
$reportTimestamp = time();

if (!empty($imageBase64)) {
    // Décodage de la Base64: enlève le préfixe
    $imageData = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imageBase64));
    
    // Nom du fichier image: timestamp_reportedId.png
    $imageFilename = $reportTimestamp . '_' . $reportedId . '.png';
    $imagePath = REPORT_IMAGES_DIR . '/' . $imageFilename;

    if (@file_put_contents($imagePath, $imageData) === false) {
        logActivity('REPORT_ERROR', $reporterId, $reportedId, "Failed to save screenshot at: " . $imagePath, $reportedIP);
        $imageFilename = 'Failed to save screenshot';
    } else {
        logActivity('REPORT_INFO', $reporterId, $reportedId, "Screenshot saved: " . $imageFilename, $reportedIP);
    }
}


// 5. Préparation et Écriture du fichier JSON du rapport détaillé
$reportData = [
    'timestamp' => date('Y-m-d H:i:s', $reportTimestamp),
    'reporterId' => $reporterId,
    'reportedId' => $reportedId,
    'reporterIP' => $reporterIP, 
    'reportedIP' => $reportedIP,                      
    'reason' => $reason,
    'sessionId' => $sessionId,
    'screenshotFile' => $imageFilename 
];

// Nom du fichier JSON: timestamp_reportedId.json
$jsonFilename = $reportTimestamp . '_' . $reportedId . '.json';
$jsonPath = REPORT_PENDING_DIR . '/' . $jsonFilename;

if (@file_put_contents($jsonPath, json_encode($reportData, JSON_PRETTY_PRINT)) === false) {
    logActivity('REPORT_ERROR', $reporterId, $reportedId, "Failed to write report file (Permissions?). Path: " . $jsonPath, $reportedIP);
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to write report file (Permissions?).', 'path' => $jsonPath]);
    exit;
}

// 6. Log général (pour la traçabilité dans activity.log)
logActivity('REPORT', $reporterId, $reportedId, $reason, $reportedIP); 

echo json_encode(['status' => 'success', 'message' => 'Signalement enregistré avec capture d\'écran: ' . $imageFilename]);
?>
