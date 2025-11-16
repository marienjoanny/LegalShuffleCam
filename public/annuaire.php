<?php
$peersFile = '/tmp/peers.json';
$peers = file_exists($peersFile) ? json_decode(file_get_contents($peersFile), true) : [];
$now = time();

// Filtre les peers actifs
$activePeers = [];
foreach ($peers as $id => $ts) {
  if ($now - $ts < 600) {
    $activePeers[$id] = $ts;
  }
}

ksort($activePeers);
$count = count($activePeers);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>📖 Annuaire des connectés</title>
  <style>
    body {
      font-family: sans-serif;
      background: #f9f9f9;
      color: #333;
      padding: 20px;
    }
    h1 {
      color: #444;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      max-width: 600px;
      background: #fff;
      box-shadow: 0 0 5px rgba(0,0,0,0.1);
    }
    th, td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
      text-align: left;
    }
    th {
      background: #eee;
    }
    a.call {
      text-decoration: none;
      color: #0077cc;
      font-weight: bold;
    }
    a.call::before {
      content: "📞 ";
    }
  </style>
</head>
<body>
  <h1>📖 Annuaire des connectés</h1>
  <p>Total connectés : <?= $count ?></p>

  <?php if ($count === 0): ?>
    <p>Aucun partenaire connecté pour le moment.</p>
  <?php else: ?>
    <table>
      <tr><th>Peer ID</th><th>Âge (sec)</th><th>Appeler</th></tr>
      <?php foreach ($activePeers as $id => $ts): ?>
        <tr>
          <td><?= htmlspecialchars($id) ?></td>
          <td><?= $now - $ts ?></td>
          <td><a class="call" href="javascript:callPeer('<?= htmlspecialchars($id) ?>')">Appeler</a></td>
        </tr>
      <?php endforeach; ?>
    </table>
  <?php endif; ?>

  <script>
    function callPeer(id) {
      if (window.parent && typeof window.parent.startCall === 'function') {
        window.parent.startCall(id);
      } else {
        alert("Fonction d'appel non disponible.");
      }
    }
  </script>
</body>
</html>
