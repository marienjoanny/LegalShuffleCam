<?php
// /public/api/register-peer.php
/**
 * Enregistre un nouvel ID de pair dans l'annuaire ou rafraîchit son statut.
 * Cette API est appelée au démarrage de la connexion de l'utilisateur.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging et la gestion de l'annuaire (updatePeerAnnuaire)
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

// ----------------------------------------------------
// 1. Mise à Jour de l'Annuaire 
// (L'entrée est créée ou rafraîchie, assurant l'archivage de l'IP, du TS et de la Session ID.)
// ----------------------------------------------------
updatePeerAnnuaire($peerId, $ipAddress, $sessionId); 


// --- 2. LOGGING ---
logActivity('REGISTER', $peerId, 'N/A', "PeerID enregistré et IP archivée.", $ipAddress); 


// --- 3. Réponse ---
echo json_encode(['status' => 'registered', 'peerId' => $peerId, 'ip' => $ipAddress, 'sessionId' => $sessionId]);
?>