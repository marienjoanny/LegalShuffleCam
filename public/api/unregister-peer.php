<?php
header('Content-Type: application/json');

$peerId = $_POST['partnerId'] ?? null;
if (!$peerId) {
  echo json_encode(['status' => 'error', 'message' => 'partnerId manquant']);
  exit;
}

$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

if (isset($peers[$peerId])) {
  unset($peers[$peerId]);
  file_put_contents($file, json_encode($peers));
  echo json_encode(['status' => 'unregistered', 'peerId' => $peerId]);
} else {
  echo json_encode(['status' => 'not_found', 'peerId' => $peerId]);
}
