<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <!-- Styles réduits pour clarté -->
  <style>
    html, body { margin:0; padding:0; height:100%; background:#0b1220; color:#e6e8ee; font-family:sans-serif; display:flex; flex-direction:column; }
    .top-bar { padding:12px; background:#111827; border-bottom:1px solid #1f2937; }
    .main { flex:1; padding:16px; }
    .video-zone { aspect-ratio:16/9; background:#000; border-radius:14px; display:flex; justify-content:center; align-items:center; }
    #localVideo { position:absolute; bottom:12px; right:12px; width:240px; height:180px; border-radius:8px; background:#000; box-shadow:0 0 6px #000a; }
    .actions { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:16px; }
    button, select { padding:12px 16px; border-radius:12px; border:none; font-weight:700; font-size:16px; cursor:pointer; }
    #topBar { margin-top:8px; display:block; font-size:14px; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="tab-bar">
      <div class="tabs">
        <div class="tab active">CAM</div>
        <div class="tab">JEUX</div>
      </div>
      <div class="loader-ring"></div>
    </div>
    <span id="topBar">Initialisation...</span>
  </div>

  <div class="main">
    <div class="video-zone" id="faceFrame">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="actions">
      <button id="btnConsent">👍 Consentement</button>
      <button id="btnVibrate">🔔 Vibre</button>
      <button id="btnReport">🚩</button>
      <select id="reportTarget"><option disabled selected>Choisir un interlocuteur</option></select>
      <select id="cameraSelect"></select>
      <button id="btnMic">🔊</button>
      <button id="btnNext" disabled>➡️ Interlocuteur suivant</button>
    </div>
  </div>

  <footer>
    <p>IP : <?php echo $_SERVER['REMOTE_ADDR'] ?? 'N/A'; ?> • UA : <?php echo substr($_SERVER['HTTP_USER_AGENT'] ?? 'N/A', 0, 50); ?></p>
  </footer>

  <!-- PeerJS -->
  <script src="https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js"></script>

  <!-- App JS -->
  <script type="module" src="/app-lite.js"></script>
</body>
</html>
