<?php
$file = __DIR__ . '/peer_ids.json';
$now = time();
$peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$filtered = [];

foreach ($peers as $id => $entry) {
  if (is_array($entry) && isset($entry['ts']) && $now - $entry['ts'] < 600) {
    $filtered[] = $id;
  }
}

echo json_encode($filtered);
?>
