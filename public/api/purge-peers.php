<?php
// /public/api/purge-peers.php
/**
 * Force le nettoyage de l'annuaire IP temporaire en supprimant toutes les entrées
 * dont le timestamp est plus vieux que le délai spécifié (600 secondes par défaut).
 * Ce script est destiné aux tâches cron ou aux outils d'administration.
 */
header('Content-Type: application/json');

// Inclure la fonction de logging et la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

// --- Récupération des données ---
// Le délai maximum (en secondes) peut être ajusté via GET
$maxAgeSeconds = $_REQUEST['maxAge'] ?? 600; 
$annuairePath = PEER_IP_ANNUAIRE;

// 🔔 Récupérer l'IP du client effectuant la purge
$clientIP = $_SERVER['REMOTE_ADDR'] ?? 'N/A';


// ----------------------------------------------------
// Fonction de Purge (copie de la logique de register-peer.php pour l'autonomie)
// ----------------------------------------------------
/**
 * Purge les entrées de l'annuaire trop vieilles.
 * Retourne le nombre d'entrées purgées.
 */
function executePurge(string $annuairePath, int $maxAgeSeconds): int {
    $peersData = [];
    $initialCount = 0;

    if (file_exists($annuairePath)) {
        $content = @file_get_contents($annuairePath);
        if ($content !== false) {
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                $peersData = $decoded;
                $initialCount = count($peersData);
            }
        }
    }

    $now = time();
    $peersDataFiltered = array_filter($peersData, function($peerData) use ($now, $maxAgeSeconds) {
        $ts = $peerData['timestamp'] ?? 0; 
        return ($now - $ts) < $maxAgeSeconds;
    });

    $purgedCount = $initialCount - count($peersDataFiltered);

    // Réécrire l'annuaire purgé
    $jsonContent = json_encode($peersDataFiltered, JSON_PRETTY_PRINT);
    @file_put_contents($annuairePath, $jsonContent, LOCK_EX);
    
    return $purgedCount;
}

// ----------------------------------------------------
// 1. Exécution de la Purge
// ----------------------------------------------------
$purgedCount = executePurge($annuairePath, (int)$maxAgeSeconds);
$finalCount = count(json_decode(@file_get_contents($annuairePath), true) ?? []);


// ----------------------------------------------------
// 2. LOGGING de l'opération
// ----------------------------------------------------
logActivity('PEER_PURGE', 'CRON_JOB', 'N/A', "Purge de l'annuaire effectuée. Supprimés: {$purgedCount} entrées.", $clientIP);


// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
echo json_encode([
    'status' => 'success', 
    'purged_count' => $purgedCount, 
    'remaining_peers' => $finalCount,
    'max_age_seconds' => (int)$maxAgeSeconds,
    'timestamp' => time()
]);
?>
