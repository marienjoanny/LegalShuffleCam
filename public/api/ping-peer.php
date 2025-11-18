<?php
header('Content-Type: application/json');
$peerId = $_GET['peerId'] ?? null;
if (!$peerId) {
  echo json_encode(['status' => 'error', 'message' => 'peerId manquant']);
  exit;
}
$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$now = time();
if (isset($peers[$peerId]) && ($now - $peers[$peerId]) < 600) {
  echo json_encode(['status' => 'alive']);
} else {
  echo json_encode(['status' => 'dead']);
}
