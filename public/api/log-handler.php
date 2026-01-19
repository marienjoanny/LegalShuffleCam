<?php
// /public/api/log-handler.php
header("Content-Type: application/json");

// Inclure la fonction de logging et la gestion de l'annuaire
require_once __DIR__ . "/log_activity.php";

// --- Récupération des données POST ---
$type = $_POST["type"] ?? "INFO"; // Ex: CONNECTION, DISCONNECT
$callerId = $_POST["callerId"] ?? null;
$partnerId = $_POST["partnerId"] ?? null;
$sessionId = $_POST["sessionId"] ?? "N/A";
$message = $_POST["message"] ?? "Événement de session sans détail.";

// 🔔 Récupérer l'adresse IP de l'utilisateur qui fait l'appel
$ipAddress = $_SERVER["REMOTE_ADDR"] ?? "N/A";

if (!$callerId) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing callerId"]);
    exit;
}

// ---------------------------------
// 1. Mise à jour de l'annuaire IP 
// ---------------------------------
updatePeerAnnuaire($callerId, $ipAddress, $sessionId);

// Si c'est un événement de connexion, nous loguons l'événement de manière spécifique.
if ($type === "CONNECTION") {
    $logMessage = "Connexion établie. Session: {$sessionId}. Partenaire: {$partnerId}";
} elseif ($type === "DISCONNECT") {
    $logMessage = "Déconnexion. Session: {$sessionId}. Cause: {$message}";
} else {
    $logMessage = $message;
}

// ---------------------------------
// 2. Log de l'activité 
// ---------------------------------
logActivity($type, $callerId, $partnerId, $logMessage, "N/A"); 


// ---------------------------------
// 3. Réponse 
// ---------------------------------
echo json_encode(["status" => "logged", "type" => $type, "callerId" => $callerId]);
?>
