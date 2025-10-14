<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <!-- Styles identiques à ta version -->
  <style>
    /* ... (CSS inchangé, repris depuis ta version) ... */
  </style>
</head>
<body>
  <!-- HTML identique à ta version -->
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

    const remoteVideo = document.getElementById('remoteVideo');
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
</body>
</html>
