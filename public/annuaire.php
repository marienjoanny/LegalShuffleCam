<?php
$peersFile = '/tmp/peers.json';
// Assurez-vous que le décodage échoue proprement
$peers = file_exists($peersFile) ? json_decode(file_get_contents($peersFile), true) : [];

if ($peers === null) {
    $peers = [];
}

$now = time();

// 1. CORRECTION: Nettoyer l'annuaire en utilisant 'timestamp' (clé définie dans log_activity.php)
$activePeers = array_filter($peers, function($peerData) use ($now) {
    // Vérifie si la clé 'timestamp' existe et si elle est active (< 600s)
    return isset($peerData['timestamp']) && ($now - $peerData['timestamp'] < 600);
});

// 2. Mettre à jour le fichier peers.json avec la liste nettoyée
file_put_contents($peersFile, json_encode($activePeers));

// 3. Trier les IDs pour l'affichage
ksort($activePeers);

$count = count($activePeers);

// 4. Préparer les données pour l'affichage
$peersForDisplay = [];
foreach ($activePeers as $id => $data) {
    $peersForDisplay[$id] = [
        'timestamp' => $data['timestamp'],
        'ip' => $data['ip'] ?? 'N/D'
    ];
}
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
      border-bottom: 1px solid #444;
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
    button.delete {
      background: #dc2626;
      color: #fff;
      border: none;
      padding: 0.3em 0.6em;
      border-radius: 4px;
      cursor: pointer;
    }
    #topbar-feedback {
      background: #222;
      color: #fff;
      padding: 8px;
      font-family: sans-serif;
      text-align: center;
      display: none;
      margin-bottom: 1em;
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
<div id="topbar-feedback"></div>
<h1>📖 Annuaire des connectés</h1>
<button id="refreshBtn" onclick="location.reload()">🔄 Actualiser</button>
<p>Total connectés : <?= $count ?></p>

<?php if ($count === 0): ?>
  <p>Aucun partenaire connecté pour le moment.</p>
<?php else: ?>
  <table>
    <tr><th>Peer ID</th><th>Âge (sec)</th><th>IP</th><th>Appeler</th><th>Supprimer</th></tr>
    <?php foreach ($peersForDisplay as $id => $data): ?>
      <tr>
        <td><?= htmlspecialchars($id) ?></td>
        <td><?= $now - $data['timestamp'] ?></td>
        <td><?= htmlspecialchars($data['ip']) ?></td>
        <td><a class="call" href="javascript:void(0)" onclick="openCall('<?= htmlspecialchars($id) ?>')">Appeler</a></td>
        <td><button class="delete" onclick="deletePeer(this)">🚮</button></td>
      </tr>
    <?php endforeach; ?>
  </table>
<?php endif; ?>

<script>
function showTopbar(msg, color="#222") {
  const bar = document.getElementById("topbar-feedback");
  bar.textContent = msg;
  bar.style.background = color;
  bar.style.display = "block";
  setTimeout(() => bar.style.display = "none", 3000);
}

function openCall(partnerId) {
  fetch("/api/ping-peer.php?peerId=" + encodeURIComponent(partnerId))
    .then(res => res.json())
    .then(json => {
      if (json.status === "alive") {
        const url = "/index-real.php?partnerId=" + encodeURIComponent(partnerId);
        showTopbar("📞 Ouverture de la session avec " + partnerId);
        window.open(url, "_blank"); 
      } else {
        showTopbar("⛔ Ce peerId n’est plus actif.", "#a00");
      }
    }).catch(() => showTopbar("❌ Erreur réseau", "#a00"));
}

function deletePeer(btn) {
  const tr = btn.closest("tr");
  const peerId = tr.querySelector("td").textContent.trim(); 
  showTopbar("🧪 Suppression de : " + peerId);

  fetch("/api/unregister-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "partnerId=" + encodeURIComponent(peerId)
  }).then(response => response.json())
    .then(data => {
      if (data.status === "unregistered") {
        showTopbar("✅ Supprimé : " + peerId, "#0a0");
        setTimeout(() => location.reload(), 1000);
      } else {
        showTopbar("❌ Échec suppression : " + peerId, "#a00");
      }
    }).catch(() => showTopbar("❌ Erreur réseau", "#a00"));
}
</script>
</body>
</html>
