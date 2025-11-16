<?php
header('Content-Type: application/json');
$partnerId = $_POST['partnerId'] ?? null;

if (!$partnerId) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing partnerId']);
  exit;
}

// Vérifie que le partnerId existe bien dans /tmp/peers.json
$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$now = time();

if (isset($peers[$partnerId]) && $now - $peers[$partnerId] < 600) {
  echo json_encode(['status' => 'call', 'partnerId' => $partnerId]);
} else {
  echo json_encode(['status' => 'invalid']);
}
