<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Test caméra + PeerJS</title>
  <script src="https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js"></script>
</head>
<body style="background:#0b1220;color:#e6e8ee;font-family:sans-serif;padding:20px">
<script>
(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  document.body.innerHTML += "<p>📷 Caméra temporaire activée ✅</p>";

  const devices = await navigator.mediaDevices.enumerateDevices();
  document.body.innerHTML += `<p>📷 Périphériques détectés (${devices.length}):</p><ul>`;
  devices.forEach((d, i) => {
    document.body.innerHTML += `<li>[${i}] ${d.kind}: ${d.label} (ID: ${d.deviceId})</li>`;
  });
  document.body.innerHTML += "</ul>";

  const cams = devices.filter(d => d.kind === "videoinput");
  document.body.innerHTML += `<p>📷 Nombre de caméras (videoinput): ${cams.length}</p>`;

  const peer = new Peer(undefined, {
    host: location.hostname,
    port: 443,
    path: "/peerjs",
    secure: true
  });

  peer.on("open", id => {
    document.body.innerHTML += `<h2 style="color:limegreen">✅ ID PeerJS : ${id}</h2>`;
  });

  peer.on("error", err => {
    document.body.innerHTML += `<h2 style="color:red">❌ Erreur PeerJS : ${err}</h2>`;
  });
})();
</script>
</body>
</html>
