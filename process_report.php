<?php
// ==============================================================================
// FICHIER: process_report.php
// Rôle: Réceptionne le POST (données + image base64), crée le JSON et le PNG 
//       dans le dossier d'entrée (/logs/reports).
// Ce script est le déclencheur du processus de ban par CRON.
// ==============================================================================

// --- Configuration des Chemins ---
$LOG_DIR = __DIR__ . '/logs/reports/';
$IP_BAN_FILE = __DIR__ . '/data/banned_ips.txt';

// --- Configuration des Headers de Réponse ---
header('Content-Type: application/json');

// --- 1. Vérification du POST et de l'IP ---

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Méthode non autorisée.']);
    exit;
}

// Fonction pour récupérer l'IP réelle de l'utilisateur
function getClientIp() {
    // Vérification des en-têtes proxy courants
    foreach (['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR'] as $key) {
        if (isset($_SERVER[$key])) {
            $ip = $_SERVER[$key];
            // Si c'est un X-Forwarded-For, prend le premier IP (celui du client)
            if (strpos($key, 'FORWARDED') !== false && strpos($ip, ',') !== false) {
                $ip = trim(explode(',', $ip)[0]);
            }
            return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'Inconnu';
        }
    }
    return 'Inconnu';
}

$reporterIP = getClientIp();

// --- 2. Validation et Nettoyage des Données ---

// Récupération des données POST JSON brutes
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Données JSON invalides ou manquantes.']);
    exit;
}

$required_fields = ['reportedId', 'reportedIP', 'reason', 'reporterId'];
foreach ($required_fields as $field) {
    if (empty($data[$field])) {
        // Pour des raisons de sécurité, ne pas afficher le nom du champ manquant directement.
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => "Champ de données requis manquant."]);
        exit;
    }
}

// Nettoyage de base
$reportedId = htmlspecialchars($data['reportedId']);
$reportedIP = filter_var($data['reportedIP'], FILTER_VALIDATE_IP) ? $data['reportedIP'] : 'Invalide';
$reason = htmlspecialchars($data['reason']);
$reporterId = htmlspecialchars($data['reporterId']);
$screenshotBase64 = $data['screenshotBase64'] ?? null;

// --- 3. Vérification du Ban Actif de l'IP REPORTÉE (Info seulement) ---
$isAlreadyBanned = false;
if (file_exists($IP_BAN_FILE)) {
    $bannedIps = file($IP_BAN_FILE, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($bannedIps as $line) {
        $currentIp = trim(explode('#', $line)[0]);
        if ($currentIp === $reportedIP) {
            $isAlreadyBanned = true;
            break;
        }
    }
}


// --- 4. Traitement de l'ID Unique et de la Capture PNG ---

// ID unique pour le rapport, sera utilisé comme partie du nom de fichier
$reportId = uniqid('rpt_', true); 
$timestamp = date('YmdHis');
$baseFilename = "{$timestamp}-{$reportId}";
$screenshotFilename = 'None';

if ($screenshotBase64) {
    // Nettoyer le préfixe data:image/png;base64, s'il est présent
    $base64_data = preg_replace('/^data:image\/(png|jpeg|webp);base64,/', '', $screenshotBase64);
    $binary_data = base64_decode($base64_data);
    
    if ($binary_data !== false && $binary_data !== '') {
        $screenshotFilename = "{$baseFilename}.png";
        $pngPath = $LOG_DIR . $screenshotFilename;
        
        // Assurez-vous que le dossier de log est inscriptible
        if (!is_writable($LOG_DIR)) {
             error_log("ERREUR CRITIQUE: Le répertoire de log n'est pas inscriptible: {$LOG_DIR}");
             $screenshotFilename = 'Error_Dir_Perm';
        } elseif (!file_put_contents($pngPath, $binary_data)) {
            error_log("ECHEC: Écriture du fichier PNG à {$pngPath}");
            $screenshotFilename = 'Error_PNG_Write';
        }
    } else {
         error_log("AVERTISSEMENT: Données Base64 invalides ou vides.");
         $screenshotFilename = 'Error_Base64_Invalid';
    }
}


// --- 5. Création du Fichier JSON (Le déclencheur pour CRON) ---

$reportData = [
    'reportId'       => $reportId,
    'timestamp'      => $timestamp,
    'reporterIP'     => $reporterIP,
    'reporterId'     => $reporterId,
    'reportedIP'     => $reportedIP,
    'reportedId'     => $reportedId,
    'reason'         => $reason,
    'screenshotFile' => $screenshotFilename, // Nom de fichier PNG ou 'None'
    'status'         => $isAlreadyBanned ? 'Pending_Recheck' : 'Pending_Initial_Ban'
];

$jsonPath = $LOG_DIR . "{$baseFilename}.json";
$jsonContent = json_encode($reportData, JSON_PRETTY_PRINT);

if (file_put_contents($jsonPath, $jsonContent)) {
    // --- Succès ---
    http_response_code(200);
    $message = $isAlreadyBanned ? 
        'Signalement reçu. L\'IP était déjà bannie, rapport en attente de révision.' : 
        'Signalement reçu. Le ban préventif est en cours de traitement.';
    
    echo json_encode([
        'status' => 'success',
        'message' => $message,
        'reportId' => $reportId
    ]);
    
    // NOTE: C'est ici que CRON détectera le nouveau fichier JSON.
    
} else {
    // --- Échec d'écriture JSON ---
    http_response_code(500);
    echo json_encode([
        'status' => 'error', 
        'message' => 'Erreur serveur: Impossible d\'écrire le rapport JSON.',
        'path' => $jsonPath 
    ]);
}

?>
