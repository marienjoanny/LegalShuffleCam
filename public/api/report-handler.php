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
