<?php
if (!isset($_COOKIE['age_verified']) || $_COOKIE['age_verified'] !== '1') {
  file_put_contents('/var/log/legalshufflecam-denied.log', date('c') . ' DENIED ' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n", FILE_APPEND);
  header('Location: /index.php');
  exit;
}
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #0b1220;
      color: #e6e8ee;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
    }

    .top-bar {
      padding: 12px;
      background: #111827;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .loader-ring {
      width: 20px;
      height: 20px;
      border: 3px solid #2563eb;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .main {
      flex: 1;
      display: grid;
      grid-template-rows: 1fr auto auto;
      padding: 16px;
      gap: 16px;
    }

    .video-zone {
      position: relative;
      background: #000;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #remoteVideo {
      width: 100%;
      max-width: 560px;
      height: auto;
      background: #000;
    }

    #localVideo {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 100px;
      height: 75px;
      border-radius: 10px;
      background: #000;
      box-shadow: 0 0 8px #000a;
    }

    .hint {
      text-align: center;
      font-size: 14px;
      color: #10b981;
      font-weight: 500;
    }

    .warning {
      text-align: center;
      font-size: 13px;
      color: #ef4444;
      font-weight: 500;
    }

    .actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    button {
      padding: 12px 16px;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      color: #fff;
    }

    button.red { background: #dc2626; }
    button.green { background: #10b981; }
    button.blue { background: #2563eb; }
    button.yellow { background: #fbbf24; color: #111827; }
    button:disabled { opacity: .45; filter: saturate(.6); cursor: not-allowed; }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="loader-ring"></div>
    <span>Recherche d’un partenaire…</span>
  </div>

  <div class="main">
    <div class="video-zone">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="hint">🔒 Visage visible et navigation privée requis.</div>
    <div class="warning">⚠ Votre IP est visible et loguée. Soyez respectueux !</div>

    <div class="actions">
      <button id="btnReport" class="red">Signaler</button>
      <button id="btnCam" class="yellow">📷</button>
      <button id="btnMic" class="green">🎤</button>
      <button id="btnNext" class="blue">➡️</button>
    </div>
  </div>

  <script src="/vendor/tfjs/fg-blaze-loader.js" defer></script>
  <script src="/js/face-guard.js"></script>
</body>
</html>
