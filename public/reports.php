<?php
$reportDir = __DIR__ . '/api/logs/reports';
$reports = [];

foreach (glob("$reportDir/*.json") as $file) {
    $json = json_decode(file_get_contents($file), true);
    if ($json) $reports[] = $json;
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Signalements</title>
    <style>
        body { font-family: sans-serif; background: #f9f9f9; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; vertical-align: top; }
        th { background: #eee; }
        img { max-width: 150px; max-height: 150px; }
    </style>
</head>
<body>
    <h1>📋 Signalements reçus</h1>
    <table>
        <tr>
            <th>Date</th>
            <th>Reporter</th>
            <th>Signalé</th>
            <th>IP</th>
            <th>Motif</th>
            <th>Session</th>
            <th>Image</th>
        </tr>
        <?php foreach ($reports as $r): ?>
        <tr>
            <td><?= htmlspecialchars($r['timestamp']) ?></td>
            <td><?= htmlspecialchars($r['reporterId']) ?></td>
            <td><?= htmlspecialchars($r['reportedId']) ?></td>
            <td><?= htmlspecialchars($r['ip']) ?></td>
            <td><?= htmlspecialchars($r['reason']) ?></td>
            <td><?= htmlspecialchars($r['sessionId'] ?? '-') ?></td>
            <td>
                <?php if (str_starts_with($r['imageBase64'], 'data:image')): ?>
                    <img src="<?= $r['imageBase64'] ?>" alt="Capture">
                <?php else: ?>
                    <em>Image non disponible</em>
                <?php endif; ?>
            </td>
        </tr>
        <?php endforeach; ?>
    </table>
</body>
</html>
