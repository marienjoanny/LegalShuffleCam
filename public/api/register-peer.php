<?php
header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);
$partnerId = $input['partnerId'] ?? null;
if (!$partnerId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing partnerId"]);
    exit;
}
$file = __DIR__ . '/../data/connected-partners.json';
$partners = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
if (!in_array($partnerId, $partners)) {
    $partners[] = $partnerId;
    file_put_contents($file, json_encode($partners, JSON_PRETTY_PRINT));
}
echo json_encode(["status" => "registered", "partnerId" => $partnerId]);
