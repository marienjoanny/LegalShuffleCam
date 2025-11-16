<?php
header('Content-Type: application/json');
$file = __DIR__ . '/../data/connected-partners.json';
if (!file_exists($file)) {
    echo json_encode(["count" => 0]);
    exit;
}
$partners = json_decode(file_get_contents($file), true);
$count = is_array($partners) ? count($partners) : 0;
echo json_encode(["count" => $count]);
