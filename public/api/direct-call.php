<?php
header('Content-Type: application/json');

$partnerId = $_POST['partnerId'] ?? null;

if (!$partnerId) {
    http_response_code(400);
    echo json_encode(["error" => "Missing partnerId"]);
    exit;
}

// Ici tu peux renvoyer l’ID pour que le front déclenche l’appel PeerJS
echo json_encode(["status" => "call", "partnerId" => $partnerId]);
