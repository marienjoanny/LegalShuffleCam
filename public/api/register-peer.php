<?php
header('Content-Type: application/json');

$partnerId = $_GET['peerId'] ?? null;
if (!$partnerId) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing peerId']);
  exit;
}

$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$peers[$partnerId] = time();

// Purge les sessions trop vieilles (>10 min)
$now = time();
$peers = array_filter($peers, fn($ts) => $now - $ts < 600);

file_put_contents($file, json_encode($peers));

echo json_encode(['status' => 'registered', 'peerId' => $partnerId]);
