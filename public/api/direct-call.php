<?php
// /public/api/direct-call.php
/**
 * Vérifie si un PeerID cible est actif dans l'annuaire avant de lancer un appel direct.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging (pour la constante PEER_IP_ANNUAIRE)
// Bien que non utilisé pour le log, cela sécurise l'accès au chemin de l'annuaire.
require_once __DIR__ . '/log_activity.php'; 

$partnerId = $_POST['partnerId'] ?? null;

if (!$partnerId) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing partnerId']);
  exit;
}

// Utilisation de la constante PEER_IP_ANNUAIRE définie dans log_activity.php
$file = PEER_IP_ANNUAIRE; 

// Lecture de l'annuaire temporaire
$peers = file_exists($file) ? json_decode(@file_get_contents($file), true) : [];

if ($peers === null) {
    $peers = [];
}

$now = time();
$isActive = false;

// --------------------------------------------------------------------
// CORRECTION : Vérifie si la donnée existe et si le timestamp 'ts' est frais.
// L'entrée doit être: $peers[$partnerId]['ts']
// --------------------------------------------------------------------
if (isset($peers[$partnerId]) && isset($peers[$partnerId]['ts'])) {
    $sessionAge = $now - $peers[$partnerId]['ts'];
    
    // Le pair est considéré comme actif s'il a pingé il y a moins de 600 secondes (10 minutes)
    if ($sessionAge < 600) {
        $isActive = true;
    }
}

if ($isActive) {
  echo json_encode(['status' => 'call', 'partnerId' => $partnerId]);
} else {
  // Si le pair est inactif ou n'existe pas
  echo json_encode(['status' => 'invalid', 'message' => 'Partner ID not found or session expired.']);
}
?>