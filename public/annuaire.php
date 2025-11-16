<?php
$file = __DIR__ . '/../data/connected-partners.json';
$partners = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$count = is_array($partners) ? count($partners) : 0;
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Annuaire des connectés</title>
  <style>
    body { font-family: system-ui, sans-serif; background:#0b1220; color:#e6e8ee; padding:20px; }
    h1 { color:#fbbf24; }
    .partner { background:#1f2937; padding:10px; margin:6px 0; border-radius:8px;
               display:flex; justify-content:space-between; align-items:center; }
    button { background:#2563eb; color:#fff; border:none; padding:8px 12px;
             border-radius:6px; cursor:pointer; }
  </style>
</head>
<body>
  <h1>📖 Annuaire des connectés</h1>
  <p>Total connectés : <strong><?= $count ?></strong></p>

  <?php if ($count > 0): ?>
    <?php foreach ($partners as $p): ?>
      <div class="partner">
        <span><?= htmlspecialchars($p) ?></span>
        <form method="post" action="/api/direct-call.php" style="margin:0;">
          <input type="hidden" name="partnerId" value="<?= htmlspecialchars($p) ?>" />
          <button type="submit">📞 Appeler</button>
        </form>
      </div>
    <?php endforeach; ?>
  <?php else: ?>
    <p>Aucun partenaire connecté pour le moment.</p>
  <?php endif; ?>
</body>
</html>
