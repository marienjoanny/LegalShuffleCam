<?php
// index-real.php - Version Design Clean + Moteur Stable
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>LegalShuffleCam - Version Stable</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug">
  <link rel="stylesheet" href="/css/camera.css?v=1.1">
  <link rel="stylesheet" href="/css/modal.css?v=1.1">
  <style>
    #topBar { position: fixed; top: 0; left: 0; width: 100%; padding: 10px; color: white; text-align: center; font-weight: bold; background-color: #e74c3c; z-index: 10000; transition: background 0.3s; }
  </style>
</head>
<body>
  <div id="topBar">Initialisation...</div>

  <div id="remoteVideoContainer">
    <div id="videoObscuredMessage" style="position: absolute; color: white; background: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; display: none; z-index: 10;">
      Vidéo masquée ! Revenez sur l'onglet pour continuer.
    </div>
    <video id="remoteVideo" autoplay playsinline class="video-protected"></video>
  </div>

  <div id="bottomLayout">
    <div id="controls">
      <div class="control-row">
        <select id="videoSource"><option value="">Chargement caméras...</option></select>
      </div>
      <div class="control-row">
        <button class="control-button green" id="btnConsentement">👍 Consentement</button>
        <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
      </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-locked">
          ➔ Interlocuteur suivant
        </button>
      </div>
    </div>
    <div id="localVideoContainer">
      <video id="localVideo" muted autoplay playsinline></video>
    </div>
  </div>

  <div id="consentModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Consentement mutuel</h3>
      <p style="text-align: justify; font-size: 0.9em; margin-bottom: 15px;">
        ⚠️ En cliquant sur « Oui », vous acceptez de lever le flou de protection mutuel.
      </p>
      <div class="modal-buttons">
        <button id="btnConsentYes" class="btn-yes">Oui</button>
        <button id="btnConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script src="/js/face-visible.js"></script>

  <script>
    const localVideo = document.getElementById('localVideo');
    const topBar = document.getElementById('topBar');
    const btnNext = document.getElementById('btnNextPeer');
    const videoSelect = document.getElementById('videoSource');
    const consentModal = document.getElementById('consentModal');

    // ÉCOUTEUR DU MOTEUR STABLE (face-visible.js)
    window.addEventListener('faceStatusUpdate', (e) => {
        const { isValid, ratio } = e.detail;
        const ratioPct = (ratio * 100).toFixed(1);

        if(window.mutualConsentGiven || isValid) {
            topBar.textContent = window.mutualConsentGiven ? "Consentement OK ✅" : `Visage OK (${ratioPct}%) ✅`;
            topBar.style.backgroundColor = "#1abc9c";
            btnNext.disabled = false;
            btnNext.classList.remove('btn-locked');
            if(document.getElementById('remoteVideo')) document.getElementById('remoteVideo').classList.remove('video-protected');
        } else {
            topBar.textContent = `Ratio: ${ratioPct}% / Requis: 30% ❌`;
            topBar.style.backgroundColor = "#e67e22";
            btnNext.disabled = true;
            btnNext.classList.add('btn-locked');
            if(document.getElementById('remoteVideo')) document.getElementById('remoteVideo').classList.add('video-protected');
        }
    });

    async function initDevices() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        videoSelect.innerHTML = '';
        devices.filter(d => d.kind === 'videoinput').forEach(device => {
            const opt = document.createElement('option');
            opt.value = device.deviceId;
            opt.text = device.label || `Caméra ${videoSelect.length + 1}`;
            videoSelect.appendChild(opt);
        });
    }

    async function startCamera(id = null) {
        if (window.localStream) window.localStream.getTracks().forEach(t => t.stop());
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: id ? { deviceId: { exact: id } } : true, audio: true
            });
            window.localStream = stream;
            localVideo.srcObject = stream;
            
            // On lance la détection une fois la vidéo lancée
            localVideo.onloadedmetadata = () => {
                if(typeof window.initFaceDetection === 'function') {
                    window.initFaceDetection(localVideo);
                }
            };
        } catch (err) { topBar.textContent = "Erreur Caméra"; }
    }

    videoSelect.onchange = () => startCamera(videoSelect.value);
    initDevices().then(() => startCamera());

    document.getElementById('btnConsentement').onclick = () => consentModal.style.display = "flex";
    document.getElementById('btnConsentYes').onclick = () => { window.mutualConsentGiven = true; consentModal.style.display = "none"; };
    document.getElementById('btnConsentNo').onclick = () => { window.mutualConsentGiven = false; consentModal.style.display = "none"; };
  </script>
</body>
</html>
