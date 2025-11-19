<?php
// /public/api/log_activity.php

// Chemin vers le fichier journal des activités PeerJS/Connexions
const LOG_FILE = __DIR__ . '/../../../logs/activity.log'; 

/**
 * Enregistre une activité générale (connexion, déconnexion, début d'appel).
 */
function logActivity(string $action, string $peerId, ?string $partnerId = null, ?string $message = null): void {
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'N/A';
    $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'N/A', 0, 100);

    $logData = [
        'time' => $timestamp,
        'ip' => $ip,
        'peer' => $peerId,
        'partner' => $partnerId,
        'action' => $action,
        'msg' => $message,
        'ua' => $userAgent
    ];

    $logEntry = json_encode($logData) . "\n";
    // Écriture sécurisée
    @file_put_contents(LOG_FILE, $logEntry, FILE_APPEND | LOCK_EX);
}
?>
