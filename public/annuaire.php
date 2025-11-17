<?php
$peersFile = '/tmp/peers.json';
$peers = file_exists($peersFile) ? json_decode(file_get_contents($peersFile), true) : [];
$now = time();
$callerId = $_GET["callerId"] ?? null;

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
  <title>Annuaire des connectés</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #111;
      color: #eee;
      padding: 1em;
    }
    h1 {
      font-size: 1.4em;
      margin-bottom: 0.5em;
    }
    #refreshBtn {
      background: #66ccff;
      color: #111;
      border: none;
      border-radius: 4px;
      padding: 0.5em 1em;
      font-size: 0.9em;
      cursor: pointer;
      margin-bottom: 1em;
    }
    #refreshBtn.loading {
      opacity: 0.6;
      pointer-events: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #222;
    }
    th {
      background: #333;
      font-weight: bold;
    }
    th, td {
      padding: 0.6em;
      border-bottom: 1px solid #ddd;
      font-size: 0.95em;
    }
    a.call {
      color: #66ccff;
      font-weight: bold;
      text-decoration: none;
    }
    a.call::before {
      content: "📞 ";
    }
    @media (max-width: 600px) {
      th, td {
        font-size: 0.85em;
        padding: 0.4em;
      }
    }
  </style>
</head>
<body>
  <h1>📖 Annuaire des connectés</h1>
  <button id="refreshBtn" onclick="refreshAnnuaire()">🔄 Actualiser</button>
  <div id="annuaireContent">
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
<td><a class="call" href="javascript:void(0)" onclick="openCall('<?= htmlspecialchars($id) ?>')">Appeler</a></td>
<td><form method="POST" action="/api/unregister-peer.php" style="display:inline">
<input type="hidden" name="partnerId" value="<?= htmlspecialchars($id) ?>">
<button style="background:#cc6666;color:#fff;border:none;padding:0.3em 0.6em;border-radius:3px;cursor:pointer">Supprimer</button>
</form></td>
          </tr>
        <?php endforeach; ?>
      </table>
    <?php endif; ?>
  </div>

  <script>
    function refreshAnnuaire() {
      const btn = document.getElementById('refreshBtn');
      btn.classList.add('loading');
      fetch(location.href)
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const newContent = doc.getElementById('annuaireContent');
          document.getElementById('annuaireContent').innerHTML = newContent.innerHTML;
        })
        .catch(err => alert("Erreur actualisation : " + err))
        .finally(() => btn.classList.remove('loading'));
    }

    // 🔁 Auto-refresh toutes les 30 secondes
    setInterval(refreshAnnuaire, 30000);
  </script>
<script>


  const url = `/index-real.php?callerId=${encodeURIComponent(callerId)}&partnerId=${encodeURIComponent(partnerId)}`;

  window.open(url, "_blank");

}

</script>
<script>
  const myId = localStorage.getItem("myPeerId");
  if (myId) {
    const info = document.createElement("div");
    info.textContent = `🧠 Votre peerId : ${myId}`;
    info.style = "position:fixed;bottom:5px;right:10px;font-size:0.8em;color:#ccc;background:#222;padding:4px 8px;border-radius:4px;z-index:999";
    document.body.appendChild(info);
  }
</script>
</body>
</html>
<script>

  const url = `/index-real.php?callerId=${encodeURIComponent(callerId)}&partnerId=${encodeURIComponent(partnerId)}`;
  window.open(url, "_blank");
}
</script>
<script>

  const url = `/index-real.php?callerId=${encodeURIComponent(callerId)}&partnerId=${encodeURIComponent(partnerId)}`;
  window.open(url, "_blank");
}
</script>
<script>
function openCall(partnerId) {
  const url = `/index-real.php?partnerId=${encodeURIComponent(partnerId)}`;
  window.open(url, "_blank");
}
</script>
