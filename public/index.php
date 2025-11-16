<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Test PeerJS</title>
  <script src="https://legalshufflecam.ovh/peerjs/peer.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; background: #111; color: #eee; padding: 2em; }
    pre { background: #222; padding: 1em; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🧪 Test PeerJS</h1>
  <pre id="log">Initialisation...</pre>

  <script>
    const log = msg => {
      document.getElementById('log').textContent += "\n" + msg;
      console.log(msg);
    };

    log("📡 Chargement de PeerJS...");

    const peer = new Peer(undefined, {
      host: 'legalshufflecam.ovh',
      port: 443,
      path: '/peerjs',
      secure: true
    });

    peer.on('open', id => {
      log("✅ PeerJS connecté. ID généré : " + id);
    });

    peer.on('error', err => {
      log("❌ Erreur PeerJS : " + err.type + " → " + err.message);
    });

    peer.on('disconnected', () => {
      log("⚠️ Déconnecté du serveur PeerJS");
    });

    peer.on('close', () => {
      log("🔒 Connexion PeerJS fermée");
    });
  </script>
</body>
</html>
