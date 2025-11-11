#!/bin/bash

echo "📦 Création du fichier report-handler.php..."

mkdir -p /var/www/legalshufflecam/api/logs/reports

cat << 'PHP' > /var/www/legalshufflecam/api/report-handler.php
<?php
// 📥 Récupère les données JSON envoyées par app.js
$data = json_decode(file_get_contents("php://input"), true);

if (!$data || !isset($data['remoteId'], $data['reporterId'], $data['image'], $data['reason'])) {
  http_response_code(400);
  echo "Données incomplètes";
  exit;
}

// 📁 Dossier de stockage des signalements
$logDir = __DIR__ . '/logs/reports';
if (!is_dir($logDir)) {
  mkdir($logDir, 0775, true);
}

// 🕒 Timestamp et nom de fichier unique
$timestamp = date("Ymd-His");
$filename = "$logDir/report-$timestamp-{$data['remoteId']}.json";

// 🧾 Contenu du signalement
$report = [
  "timestamp"   => $timestamp,
  "reporterId"  => $data['reporterId'],
  "reportedId"  => $data['remoteId'],
  "ip"          => $data['ip'] ?? "unknown",
  "reason"      => $data['reason'],
  "imageBase64" => $data['image'],
  "sessionId"   => $data['sessionId'] ?? null
];

// 💾 Sauvegarde en JSON
file_put_contents($filename, json_encode($report, JSON_PRETTY_PRINT));

http_response_code(200);
echo "Signalement enregistré";
?>
PHP

chmod 644 /var/www/legalshufflecam/api/report-handler.php
echo "✅ report-handler.php créé et prêt à recevoir les signalements"
