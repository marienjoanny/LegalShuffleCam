<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <style>
    html, body {
      margin: 0; padding: 0; height: 100%;
      background: #0b1220; color: #e6e8ee;
      font-family: system-ui, sans-serif;
      display: flex; flex-direction: column;
    }
    video {
      object-fit: cover;
    }
    .top-bar {
      padding: 12px; background: #111827;
      display: flex; flex-direction: column;
      border-bottom: 1px solid #1f2937;
    }
    .tab-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px;
    }
    .tabs {
      display: flex; gap: 12px;
    }
    .tab {
      padding: 8px 16px;
      background: #1f2937;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      color: #e6e8ee;
    }
    .tab.active {
      background: #2563eb;
      color: #fff;
    }
    .loader-ring {
      width: 20px; height: 20px;
      border: 3px solid #2563eb; border-top-color: transparent;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .main {
      flex: 1; display: grid;
      grid-template-rows: 1fr auto auto;
      padding: 16px; gap: 16px;
    }
    .video-zone {
      width: 100%;
      max-width: 100%;
      aspect-ratio: 16 / 9;
      position: relative;
      background: #000;
      border-radius: 14px;
      /* overflow: hidden; ← à commenter si besoin */
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #remoteVideo {
      width: 100%;
      height: auto;
      max-width: 100%;
      border-radius: 12px;
    }
    #localVideo {
      position: absolute;
      bottom: 12px;
      right: 12px;
      width: 240px;
      height: 180px;
      border-radius: 8px;
      background: #000;
      box-shadow: 0 0 6px #000a;
    }
    .warning {
      text-align: center; font-size: 13px;
      color: #ef4444; font-weight: 500;
    }
    .actions {
      display: flex; justify-content: center;
      gap: 12px; flex-wrap: wrap;
    }
    button, select {
      padding: 12px 16px; border-radius: 12px; border: none;
      font-weight: 700; font-size: 16px; cursor: pointer; color: #fff;
    }
    button.red { background: #dc2626; }
    button.green { background: #10b981; }
    button.blue { background: #2563eb; }
    button.yellow { background: #fbbf24; color: #111827; }
    button.purple { background: #7c3aed; }
    select.yellow { background: #fbbf24; color: #111827; }
    button:disabled, select:disabled {
      opacity: .45; filter: saturate(.6); cursor: not-allowed;
    }
    footer {
      background: #111827;
      border-top: 1px solid #1f2937;
      padding: 16px;
      text-align: center;
      font-size: 13px;
      color: #94a3b8;
    }
    footer a {
      color: #fbbf24;
      text-decoration: none;
      margin: 0 6px;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="tab-bar">
      <div class="tabs">
        <div class="tab active" id="tabCam">CAM</div>
        <div class="tab" id="tabGames">JEUX</div>
      </div>
      <div class="loader-ring" id="loaderRing"></div>
    </div>
    <span id="topBar">Chargement de la détection de visage...</span>
  </div>

  <div class="main">
    <div class="video-zone" id="faceFrame">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="warning">⚠ Votre IP est visible et loguée. Visage visible et navigation privée requis !</div>

    <div class="actions">
      <button id="btnConsent" class="green">👍 Consentement</button>
      <button id="btnVibrate" class="purple">🔔 Vibre</button>
      <button id="btnReport" class="red">🚩</button>
      <select id="cameraSelect" class="yellow"></select>
      <button id="btnMic" class="green">🔊</button>
      <button id="btnNext" class="blue">➡️ Interlocuteur suivant</button>
    </div>
  </div>

  <footer>
    <p>
      <a href="/accessibilite.html">Accessibilité</a> •
      <a href="/cgu.html">CGU</a> •
      <a href="/contact.html">Contact</a> •
      <a href="/confidentialite.html">Confidentialité</a> •
      <a href="/cookies.html">Cookies</a> •
      <a href="/mentions-legales.html">Mentions légales</a> •
      <a href="/moderation.html">Modération</a> •
      <a href="/reglement.html">Règlement</a> •
      <a href="/sitemap.html">Plan du site</a>
    </p>
    <p style="margin-top:8px;">
      🔗 <a href="https://github.com/marienjoanny/LegalShuffleCam/tree/main/public" target="_blank">Voir le dépôt GitHub</a>
    </p>
    <p style="font-size:11px; margin-top:8px;">
      IP : <?php echo $_SERVER['REMOTE_ADDR'] ?? 'N/A'; ?> •
      UA : <?php echo $_SERVER['HTTP_USER_AGENT'] ?? 'N/A'; ?>
    </p>
  </footer>

  <!-- Librairies externes -->
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/tracking-min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/data/face-min.js"></script>
  <script src="/js/rtc-core.js" defer></script>
  <script src="/js/face-visible.js" defer></script>
  <script src="/app.js" defer></script>
  <script src="/js/listener.js" defer></script>
</body>
</html>