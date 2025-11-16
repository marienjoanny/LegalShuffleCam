<?php
header('Content-Type: application/json');
$exclude = $_GET['exclude'] ?? null;
$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

$now = time();
$validPeers = [];
foreach ($peers as $id => $ts) {
  if ($now - $ts < 600 && $id !== $exclude) {
    $validPeers[] = $id;
  }
}

if (count($validPeers) > 0) {
  $partnerId = $validPeers[array_rand($validPeers)];
  echo json_encode(['status' => 'call', 'partnerId' => $partnerId]);
} else {
  echo json_encode(['status' => 'empty']);
}
