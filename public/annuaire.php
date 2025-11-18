<?php
$peersFile = '/tmp/peers.json';
$peers = file_exists($peersFile) ? json_decode(file_get_contents($peersFile), true) : [];
$now = time();
$peers = array_filter($peers, fn($ts) => $now - $ts < 600);
file_put_contents($peersFile, json_encode($peers));
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
<div id="topbar-feedback" style="background:#222;color:#fff;padding:8px;font-family:sans-serif;text-align:center;display:none;"></div>
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
          </tr>
        <?php endforeach; ?>
      </table>
    <?php endif; ?>
  </div>

<script>
function deletePeer(btn) {
  const li = btn.closest("tr");
  const peerId = tr.querySelector("td").textContent.trim();
  fetch("/api/unregister-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "partnerId=" + encodeURIComponent(peerId)
  }).then(() => location.reload());
}
</script>
<script>
function showTopbar(msg, color="#222") {
  const bar = document.getElementById("topbar-feedback");
  bar.textContent = msg;
  bar.style.background = color;
  bar.style.display = "block";
  setTimeout(() => bar.style.display = "none", 3000);
}

function deletePeer(btn) {
  const li = btn.closest("tr");
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
    }).catch(err => showTopbar("❌ Erreur réseau", "#a00"));
}
</script>
<script>
function openCall(partnerId) {
  const callerId = localStorage.getItem("myPeerId");
  if (!callerId) {
    showTopbar("⛔ Votre peerId n’est pas encore initialisé.");
    return;
  }
  fetch(`/api/ping-peer.php?peerId=${encodeURIComponent(partnerId)}`)
    .then(res => res.json())
    .then(json => {
      if (json.status === "alive") {
        const url = `/index-real.php?callerId=${encodeURIComponent(callerId)}&partnerId=${encodeURIComponent(partnerId)}`;
        showTopbar("📞 Appel vers " + partnerId);
        window.open(url, "_blank");
      } else {
        showTopbar("⛔ Ce peerId n’est plus actif.", "#a00");
      }
    }).catch(() => showTopbar("❌ Erreur réseau", "#a00"));
}
</script>
</body>

  const callerId = localStorage.getItem("myPeerId");

  if (!callerId) {

    alert("⛔ Votre peerId n’est pas encore initialisé. Veuillez ouvrir une session d’appel d’abord.");

    return;

  }

  fetch(`/api/ping-peer.php?peerId=${encodeURIComponent(partnerId)}`)

    .then(res => res.json())

    .then(json => {

      if (json.status === "alive") {

        const url = `/index-real.php?callerId=${encodeURIComponent(callerId)}&partnerId=${encodeURIComponent(partnerId)}`;

        window.open(url, "_blank");

      } else {

        alert("⛔ Ce peerId n’est plus actif.");

      }

    });

}
}
</script>
