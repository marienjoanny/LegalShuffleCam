<?php
header('Content-Type: application/json');
$file = __DIR__ . '/../data/connected-partners.json';
if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}
$partners = json_decode(file_get_contents($file), true);
echo json_encode($partners);
