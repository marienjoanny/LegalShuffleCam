<?php
// Enregistre le peerId dans peer_ids.json
$peerId = $_POST['peerId'] ?? null;
if (!$peerId) {
  http_response_code(400);
  echo json_encode(["error" => "peerId manquant"]);
  exit;
}

$file = __DIR__ . '/peer_ids.json';
$peers = [];

if (file_exists($file)) {
  $json = file_get_contents($file);
  $peers = json_decode($json, true) ?? [];
}

// Ajout ou mise à jour
$peers[$peerId] = time();

// Nettoyage des anciens (plus de 5 minutes)
$peers = array_filter($peers, fn($t) => $t > time() - 300);

file_put_contents($file, json_encode($peers, JSON_PRETTY_PRINT));
echo json_encode(["status" => "ok", "count" => count($peers)]);
