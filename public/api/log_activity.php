<?php
/**
 * /api/log_activity.php
 * Fonctions utilitaires pour la journalisation des activités (connexions, erreurs, rapports)
 * et la gestion de l'annuaire temporaire des IP des pairs.
 */

// --- CHEMINS DE LOG ET D'ANNUAIRE ---
const ACTIVITY_LOG_PATH = __DIR__ . '/../../logs/activity.log'; 
const PEER_IP_ANNUAIRE = '/tmp/peers.json'; // Emplacement temporaire pour les mappings PeerID -> IP

// Définir le fuseau horaire pour des logs cohérents
date_default_timezone_set('Europe/Paris');

/**
 * Enregistre une activité dans le journal général (activity.log).
 * @param string $type Le type d'événement (ex: CONNECTION, REPORT, ERROR, INFO).
 * @param string $callerId L'ID PeerJS de l'utilisateur qui initie l'action.
 * @param string $partnerId L'ID PeerJS du partenaire (si applicable).
 * @param string $message Détail du message ou de la raison.
 * @param string $reportedIP L'adresse IP de la personne rapportée (optionnel).
 */
function logActivity(string $type, ?string $callerId, ?string $partnerId, string $message, ?string $reportedIP = 'N/A') {
    $clientIP = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN_IP';
    
    $logEntry = sprintf(
        "[%s] | %s | %s | %s | %s | %s | %s\n",
        date('Y-m-d H:i:s'),
        str_pad(strtoupper($type), 12, ' ', STR_PAD_RIGHT),
        str_pad($clientIP, 15, ' ', STR_PAD_RIGHT),
        str_pad($callerId ?? 'NONE', 15, ' ', STR_PAD_RIGHT),
        str_pad($partnerId ?? 'NONE', 15, ' ', STR_PAD_RIGHT),
        str_pad($reportedIP, 15, ' ', STR_PAD_RIGHT),
        $message
    );

    $logDir = dirname(ACTIVITY_LOG_PATH);
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true); 
    }

    @file_put_contents(ACTIVITY_LOG_PATH, $logEntry, FILE_APPEND | LOCK_EX);
}


/**
 * Met à jour ou ajoute l'entrée d'un pair dans l'annuaire PeerID -> IP.
 * @param string $peerId L'ID PeerJS de l'utilisateur.
 * @param string $ip L'adresse IP actuelle de l'utilisateur.
 * @param string $sessionId L'ID de session actuel de l'utilisateur.
 */
function updatePeerAnnuaire(string $peerId, string $ip, string $sessionId) {
    $annuairePath = PEER_IP_ANNUAIRE;
    $peersData = [];

    if (file_exists($annuairePath)) {
        $content = @file_get_contents($annuairePath);
        if ($content !== false) {
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                $peersData = $decoded;
            }
        }
    }

    $peersData[$peerId] = [
        'ip' => $ip,
        'sessionId' => $sessionId,
        'timestamp' => time()
    ];

    $jsonContent = json_encode($peersData, JSON_PRETTY_PRINT);
    if (@file_put_contents($annuairePath, $jsonContent, LOCK_EX) === false) {
        logActivity('ERROR', $peerId, 'N/A', "Échec de l'écriture de l'annuaire IP temporaire.", $ip);
    }
}
?>
