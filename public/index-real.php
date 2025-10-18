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
    button, select {
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
    select.yellow {
      background: #fbbf24;
      color: #111827;
    }
    button:disabled, select:disabled {
      opacity: .45;
      filter: saturate(.6);
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="loader-ring" id="loaderRing"></div>
    <span id="topBar">Chargement de la détection de visage...</span>
  </div>

  <div class="main">
    <div class="video-zone" id="faceFrame">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="hint">🔒 Visage visible et navigation privée requis.</div>
    <div class="warning">⚠ Votre IP est visible et loguée. Soyez respectueux !</div>

    <div class="actions">
      <button id="btnReport" class="red">Signaler</button>
      <select id="cameraSelect" class="yellow"></select>
      <button id="btnMic" class="green">🔊</button>
      <button id="btnNext" class="blue">➡️ Interlocuteur suivant</button>
    </div>
  </div>

  <script src="/vendor/tfjs/fg-blaze-loader.js" defer></script>
  <script src="/js/face-guard.js"></script>
  <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  <script src="/app.js" defer></script> 

  <script>
    let currentStream = null;
    const topBar = document.getElementById('topBar');
    window.faceVisible = false;

    window.checkUIUpdate = function() {
      if (topBar) {
        topBar.textContent = window.faceVisible
          ? "✅ Visage OK. Prêt à chercher un partenaire."
          : "👤 Détection faciale requise...";
      }
    };

    async function listCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        const select = document.getElementById('cameraSelect');
        select.innerHTML = '';

        videoInputs.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = `Cam ${index + 1}`;
          select.appendChild(option);
        });

        if (videoInputs.length > 0) {
          startCamera(videoInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Erreur détection caméra: ", err.message);
        if (topBar) topBar.textContent = "❌ Caméra non trouvée.";
      }
    }

    async function startCamera(deviceId) {
      try {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: true
        });

        currentStream = stream;
        document.getElementById('localVideo').srcObject = stream;

        if (typeof connectSocketAndWebRTC === 'function') {
          connectSocketAndWebRTC(stream);
        }
      } catch (err) {
        console.error("Caméra indisponible: ", err.message);
        if (topBar) topBar.textContent = "❌ Caméra refusée ou indisponible.";
      }
    }

    document.getElementById('cameraSelect').addEventListener('change', (e) => {
      startCamera(e.target.value);
    });

    listCameras();

    let remoteVideo = document.getElementById('remoteVideo');
    const btnSpeaker = document.getElementById('btnMic');
    if (btnSpeaker && remoteVideo) {
      btnSpeaker.addEventListener('click', () => {
        remoteVideo.muted = !remoteVideo.muted;
        btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
      });
    }

    window.nextInterlocutor = function() {
      console.log('[LSC] Demande d\'interlocuteur suivant...');
      if (typeof disconnectWebRTC === 'function') disconnectWebRTC();
      document.getElementById('remoteVideo').srcObject = null;
      const btnNext = document.getElementById('btnNext');
      if (btnNext) btnNext.disabled = true;
      setTimeout(() => {
        if (typeof connectSocketAndWebRTC === 'function') {
          connectSocketAndWebRTC(currentStream);
        }
      }, 1500);
    };

    const btnNext = document.getElementById('btnNext');
    if (btnNext) {
      setInterval(() => {
        const visible = window.faceVisible === true;
        btnNext.disabled = !visible;
        btnNext.textContent = visible ? '➡️ Interlocuteur suivant' : '🚫 Visage requis';
        if (visible && !btnNext.onclick) {
          btnNext.onclick = window.nextInterlocutor;
        } else if (!visible) {
          btnNext.onclick = null;
        }
      }, 500);
    }
  </script>

  <footer style="text-align:center; font-size:0.9em; margin-top:2em; opacity:0.6">
    <a href="/cgu.html">CGU</a> · <a href="/mentions-legales.html">Mentions légales</a>
  </footer>
  <button id="btnTestShuffle" style="position:fixed;bottom:1em;right:1em;z-index:9999">🔁 Test Shuffle</button>
  <script>
    document.getElementById("btnTestShuffle").addEventListener("click", () => {
      console.log("[TEST] Shuffle forcé");
      if (typeof connectSocketAndWebRTC === "function") {
        connectSocketAndWebRTC(currentStream);
      }
    });
  </script>
  <script src="app.js"></script>
</body>
</html>
