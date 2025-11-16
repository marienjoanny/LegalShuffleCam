<?php
header('Content-Type: application/json');

$callerId = $_GET['callerId'] ?? null;
$file = '/tmp/peers.json';
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];

$now = time();
$peers = array_filter($peers, fn($ts) => $now - $ts < 60); // max 60s

$available = array_keys($peers);
$available = array_filter($available, fn($id) => $id !== $callerId);

if (count($available) === 0) {
  echo json_encode(['error' => 'No available peer']);
  exit;
}

$partnerId = $available[array_rand($available)];
echo json_encode(['partnerId' => $partnerId]);
