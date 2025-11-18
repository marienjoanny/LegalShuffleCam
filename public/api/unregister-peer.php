<?php
header('Content-Type: application/json');

$peerId = $_POST['partnerId'] ?? $_GET['peerId'] ?? null;
if (!$peerId) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing peerId']);
  exit;
}

$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

unset($peers[$peerId]);
file_put_contents($file, json_encode($peers));

echo json_encode(['status' => 'unregistered', 'peerId' => $peerId]);
