<?php
// Retourne un peerId aléatoire différent du sien
$file = __DIR__ . '/peer_ids.json';
$peers = [];

if (file_exists($file)) {
  $json = file_get_contents($file);
  $peers = json_decode($json, true) ?? [];
}

// Nettoyage des anciens (plus de 5 minutes)
$peers = array_filter($peers, fn($t) => $t > time() - 300);
$ids = array_keys($peers);

// Exclure soi-même si fourni
$self = $_GET['self'] ?? null;
$ids = array_filter($ids, fn($id) => $id !== $self);

$partnerId = count($ids) > 0 ? $ids[array_rand($ids)] : null;
echo json_encode(["partnerId" => $partnerId]);
