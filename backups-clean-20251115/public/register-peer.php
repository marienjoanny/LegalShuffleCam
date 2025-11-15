<?php
$id = $_GET['id'] ?? '';
$ip = $_SERVER['REMOTE_ADDR'];
if ($id && strlen($id) >= 10) {
  $file = __DIR__ . '/peer_ids.json';
  $now = time();
  $peers = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
  $peers[$id] = ['id' => $id, 'ts' => $now, 'ip' => $ip];
  file_put_contents($file, json_encode($peers));
  echo "OK";
} else {
  echo "Invalid ID";
}
?>
