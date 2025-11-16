<?php
header('Content-Type: application/json');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}
$file = __DIR__ . '/../data/connected-partners.json';
file_put_contents($file, json_encode([]));
chmod($file, 0666);
echo json_encode(["status" => "purged"]);
