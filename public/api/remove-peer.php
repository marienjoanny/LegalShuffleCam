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
if (($key = array_search($partnerId, $partners)) !== false) {
    unset($partners[$key]);
    $partners = array_values($partners);
    file_put_contents($file, json_encode($partners, JSON_PRETTY_PRINT));
    echo json_encode(["status" => "removed", "partnerId" => $partnerId]);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Partner not found"]);
}
