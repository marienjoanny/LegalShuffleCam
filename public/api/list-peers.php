<?php
// /public/api/list-peers.php
/**
 * Renvoie la liste de tous les PeerIDs actuellement dans l'annuaire temporaire (PEER_IP_ANNUAIRE).
 * Chaque entrée inclut l'IP, le SessionID et le Timestamp de la dernière mise à jour.
 */
header('Content-Type: application/json');

// Inclure la constante PEER_IP_ANNUAIRE
require_once __DIR__ . '/log_activity.php';

$annuairePath = PEER_IP_ANNUAIRE;

// ----------------------------------------------------
// 1. Lecture de l'annuaire IP
// ----------------------------------------------------
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

// ----------------------------------------------------
// 2. Préparation de la réponse (ajoute le PeerID dans chaque objet)
// ----------------------------------------------------
$peerList = [];

foreach ($peersData as $peerId => $data) {
    $peerList[] = array_merge(['peerId' => $peerId], $data);
}


// ----------------------------------------------------
// 3. Réponse
// ----------------------------------------------------
// Note: Pas de logActivity ici, car c'est une opération de lecture fréquente
echo json_encode($peerList);
?>
