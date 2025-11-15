<?php
// Nettoyage des Peer ID expirés (plus de 10 min)
$file = __DIR__ . '/peer_ids.json';
$now = time();
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$filtered = [];

foreach ($peers as $id => $entry) {
  if (isset($entry['ts']) && $now - $entry['ts'] < 600) {
    $filtered[$id] = $entry;
  }
}

file_put_contents($file, json_encode($filtered));
echo "✅ Peer IDs nettoyés à " . date('H:i:s') . "\n";
?>
