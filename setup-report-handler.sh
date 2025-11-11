#!/bin/bash

echo "📦 Création du fichier report-handler.php..."

mkdir -p /var/www/legalshufflecam/api/logs/reports

cat << 'PHP' > /var/www/legalshufflecam/api/report-handler.php
<?php
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['remoteId'], $data['reporterId'], $data['image'], $data['reason'])) {
  http_response_code(400);
  echo "Données incomplètes";
  exit;
}

$logDir = __DIR__ . '/logs/reports';
if (!is_dir($logDir)) {
  mkdir($logDir, 0775, true);
}

$timestamp = date("Ymd-His");
$filename = "$logDir/report-$timestamp-{$data['remoteId']}.json";

$report = [
  "timestamp"   => $timestamp,
  "reporterId"  => $data['reporterId'],
  "reportedId"  => $data['remoteId'],
  "ip"          => $data['ip'] ?? "unknown",
  "reason"      => $data['reason'],
  "imageBase64" => $data['image'],
  "sessionId"   => $data['sessionId'] ?? null
];

file_put_contents($filename, json_encode($report, JSON_PRETTY_PRINT));

http_response_code(200);
echo "Signalement enregistré";
?>
PHP

chmod 644 /var/www/legalshufflecam/api/report-handler.php
echo "✅ report-handler.php prêt"

echo "🧪 Test avec curl..."
curl -s -X POST http://localhost/api/report-handler.php \
  -H "Content-Type: application/json" \
  -d '{
    "remoteId": "ABC123",
    "reporterId": "XYZ789",
    "ip": "192.168.1.42",
    "reason": "Comportement inapproprié",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...",
    "sessionId": "sess-20251110-1505"
  }'

echo -e "\n📁 Vérifie le dossier /api/logs/reports pour confirmer l’enregistrement"
