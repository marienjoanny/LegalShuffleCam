<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Test caméra + PeerJS</title>
  <script src="https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js"></script>
</head>
<body>
<script>
(async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  document.body.innerHTML += "<p>📷 Caméra temporaire activée ✅</p>";

  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter(d => d.kind === "videoinput");
  document.body.innerHTML += `<p>📷 Nombre de caméras : ${cams.length}</p>`;

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
