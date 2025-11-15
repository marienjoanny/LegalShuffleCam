<?php header('Content-Type: text/html; charset=utf-8'); ?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LegalShuffleCam</title>
  <style>
    body { font-family: sans-serif; padding: 40px; background: #f9f9f9; }
    button { font-size: 1em; padding: 5px; margin: 5px 5px 5px 0; }
    video { width: 300px; margin: 10px; background: black; }
    #log { background: #eee; padding: 10px; font-family: monospace; max-height: 200px; overflow-y: auto; }
    #peer-list li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <h1>👋 Bienvenue sur LegalShuffleCam</h1>
  <p>Test WebRTC entre deux utilisateurs via PeerJS.</p>

  <h2>🎥 Connexion</h2>
  <p><strong>Ton Peer ID :</strong> <span id="peer-id">...</span></p>
  <button onclick="showInviteLink()">🔗 Voir mon lien</button>
  <button onclick="nextPeer()">⏭️ Suivant</button>
  <p><strong>Connecté à :</strong> <span id="remote-id">...</span></p>
  <video id="local-video" autoplay muted></video>
  <video id="remote-video" autoplay></video>

  <h2>📋 Liste des Peer ID</h2>
  <button onclick="listPeers()">📋 Afficher la liste</button>
  <ul id="peer-list" style="list-style: none; padding: 0;"></ul>

  <h2>🛠 Diagnostic</h2>
  <div id="log"></div>

  <script src="https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js"></script>
  <script src="/client.js"></script>
</body>
</html>
