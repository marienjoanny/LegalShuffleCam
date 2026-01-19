<?php
// /public/api/report-handler.php
// Gère l'enregistrement des signalements complets (avec image) et des logs de consentement.

header('Content-Type: application/json');

// Inclure le logger général et l'annuaire IP.
// Ceci importe logActivity(), updatePeerAnnuaire() et la constante PEER_IP_ANNUAIRE.
require_once __DIR__ . '/log_activity.php'; 

// --- CHEMINS ---
const REPORT_PENDING_DIR = __DIR__ . '/../../logs/reports/pending_review'; 
const REPORT_IMAGES_DIR = __DIR__ . '/../../logs/reports/images'; 
const CONSENT_LOG_FILE = __DIR__ . '/../../logs/consent_log.json';

// --- 1. RÉCUPÉRATION ET UNIFICATION DES DONNÉES (Utilisation de $_REQUEST pour GET/POST) ---
// Note: Le reporterId est 'peerId' dans les logs de match.js et 'callerId' dans les rapports de index-real.php
$reporterId = $_REQUEST['callerId'] ?? $_REQUEST['peerId'] ?? null;
$reportedId = $_REQUEST['partnerId'] ?? null;
$reason = $_REQUEST['reason'] ?? 'Raison non spécifiée';
$action = $_REQUEST['action'] ?? 'report'; // 'report' ou 'log_consent'
$sessionId = $_REQUEST['sessionId'] ?? uniqid('session_'); 

$reporterIP = $_SERVER['REMOTE_ADDR'] ?? 'N/A';

if (!$reporterId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing Reporter ID (callerId or peerId)']);
    exit;
}

// ----------------------------------------------------
// NOUVEAU: 2. Branchement de la logique (Consentement vs. Signalement)
// ----------------------------------------------------

// Mise à jour de l'annuaire du signaleur (reporter) pour archiver son IP en temps réel.
updatePeerAnnuaire($reporterId, $reporterIP, $sessionId);

if ($action === 'log_consent') {
    // --- GESTION DU LOG DE CONSENTEMENT (Requête GET/callPeerApi) ---
    
    $consentStatus = $_REQUEST['consentStatus'] ?? 'STATUS_MISSING';
    
    // Log dans l'activité générale
    logActivity('CONSENT_STATUS', $reporterId, $reportedId, $consentStatus, $reporterIP);
    
    // Log détaillé dans un fichier JSON séparé pour l'audit
    $consentLogEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'reporterId' => $reporterId,
        'reportedId' => $reportedId,
        'reporterIP' => $reporterIP,
        'status' => $consentStatus,
        'sessionId' => $sessionId
    ];

    // Sauvegarde atomique (pour éviter la corruption lors de l'écriture concurrente)
    @file_put_contents(
        CONSENT_LOG_FILE, 
        json_encode($consentLogEntry) . ",\n", 
        FILE_APPEND | LOCK_EX
    );
    
    echo json_encode(['status' => 'success', 'message' => "Log de consentement enregistré: $consentStatus"]);
    exit;
}

// ----------------------------------------------------
// GESTION DU SIGNALEMENT COMPLET (Requête POST, avec Image Base64)
// ----------------------------------------------------

// La capture d'écran est attendue dans le corps POST
$imageBase64 = $_POST['imageBase64'] ?? ''; 

if (!$reportedId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing Partner ID (partnerId) for full report']);
    exit;
}


// 3. Gestion de l'IP du signalé (via annuaire)
$reportedIP = 'NOT_FOUND_IN_ANNUAIRE';
if (file_exists(PEER_IP_ANNUAIRE)) {
    $peersData = json_decode(@file_get_contents(PEER_IP_ANNUAIRE), true);
    if (isset($peersData[$reportedId]['ip'])) {
        $reportedIP = $peersData[$reportedId]['ip'];
    }
}

// 4. Vérification des dossiers de rapports
if (!is_dir(REPORT_PENDING_DIR) || !is_dir(REPORT_IMAGES_DIR)) {
     @mkdir(REPORT_PENDING_DIR, 0775, true);
     @mkdir(REPORT_IMAGES_DIR, 0775, true);
}


// --- 5. SAUVEGARDE DE LA CAPTURE D'ÉCRAN ---
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
        $imageFilename = 'Failed to save screenshot (Check permissions)';
    } else {
        logActivity('REPORT_INFO', $reporterId, $reportedId, "Screenshot saved: " . $imageFilename, $reportedIP);
    }
}


// 6. Préparation et Écriture du fichier JSON du rapport détaillé
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

// 7. Log général (pour la traçabilité dans activity.log)
logActivity('REPORT', $reporterId, $reportedId, $reason, $reportedIP); 

echo json_encode(['status' => 'success', 'message' => 'Signalement enregistré avec capture d\'écran: ' . $imageFilename]);

?>