<?php
// index-real.php - Version avec Protection Flou + Sélecteur Caméra
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>LegalShuffleCam - Sécurité & Caméra</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug"> 
  <style>
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: none; justify-content: center; align-items: center; z-index: 20000; }
    .modal-content { background: #2c3e50; padding: 20px; border-radius: 8px; max-width: 500px; color: #fff; text-align: center; }
    .modal-buttons { margin-top: 20px; display: flex; justify-content: space-around; }
    .btn-yes { background-color: #27ae60; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-no { background-color: #c0392b; color: #fff; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    #topBar { position: fixed; top: 0; left: 0; width: 100%; padding: 10px; color: white; text-align: center; font-weight: bold; background-color: #e74c3c; z-index: 10000; }
    
    /* CLASSES DE SÉCURITÉ */
    .video-protected { filter: blur(50px) brightness(0.6) grayscale(0.5) !important; transition: filter 0.5s ease; }
    .btn-locked { opacity: 0.3 !important; cursor: not-allowed !important; pointer-events: none; }
    #videoSource { background:#2c3e50; color:white; width:100%; margin-bottom:10px; border:1px solid #34495e; padding: 8px; border-radius: 4px; }
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
      <p>⚠️ En cliquant sur « Oui », vous acceptez de lever le flou de protection.</p>
      <div class="modal-buttons">
        <button id="btnConsentYes" class="btn-yes">Oui</button>
        <button id="btnConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script>
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    const topBar = document.getElementById('topBar');
    const btnNext = document.getElementById('btnNextPeer');
    const videoSelect = document.getElementById('videoSource');
    const consentModal = document.getElementById('consentModal');

    let lastAcceptedTime = 0;
    let lastAcceptedRects = [];
    const MIN_FACE_RATIO = 0.25; // Un peu plus souple
    const MAX_VALID_AGE = 2500;
    window.mutualConsentGiven = false;

    function showTopbarLog(msg, color) {
        topBar.textContent = msg;
        if(color) topBar.style.color = color;
    }

    // --- TRACKER ---
    const tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(2.5);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);
    tracking.track('#localVideo', tracker);

    tracker.on('track', event => {
        const now = Date.now();
        const videoArea = localVideo.videoWidth * localVideo.videoHeight;

        if(event.data.length > 0){
            event.data.forEach(rect => {
                const faceArea = rect.width * rect.height;
                if((faceArea / videoArea) >= MIN_FACE_RATIO){
                    lastAcceptedRects = [rect];
                    lastAcceptedTime = now;
                }
            });
        }

        const age = now - lastAcceptedTime;
        const isFaceValid = (lastAcceptedRects.length > 0 && age < MAX_VALID_AGE);

        if(window.mutualConsentGiven || isFaceValid) {
            localVideo.style.border = "4px solid #2ecc71";
            showTopbarLog(window.mutualConsentGiven ? "Consentement OK ✅" : "Visage OK ✅", "#1abc9c");
            btnNext.disabled = false;
            btnNext.classList.remove('btn-locked');
            if(remoteVideo) remoteVideo.classList.remove('video-protected');
        } else {
            localVideo.style.border = "4px solid #e74c3c";
            showTopbarLog("Recherchez le visage... ❌", "#e67e22");
            btnNext.disabled = true;
            btnNext.classList.add('btn-locked');
            if(remoteVideo) remoteVideo.classList.add('video-protected');
        }
    });

    // --- CAMÉRAS ---
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
        const stream = await navigator.mediaDevices.getUserMedia({
            video: id ? { deviceId: { exact: id } } : true,
            audio: true
        });
        window.localStream = stream;
        localVideo.srcObject = stream;
        
        // Update P2P track if in call
        if (window.currentCall && window.currentCall.peerConnection) {
            const sender = window.currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
        }
    }

    videoSelect.onchange = () => startCamera(videoSelect.value);
    initDevices().then(() => startCamera());

    // --- UI ---
    document.getElementById('btnConsentement').onclick = () => consentModal.style.display = "flex";
    document.getElementById('btnConsentYes').onclick = () => { window.mutualConsentGiven = true; consentModal.style.display = "none"; };
    document.getElementById('btnConsentNo').onclick = () => { window.mutualConsentGiven = false; consentModal.style.display = "none"; };
    document.addEventListener("visibilitychange", () => {
        document.getElementById('videoObscuredMessage').style.display = document.hidden ? "block" : "none";
    });
  </script>
</body>
</html>
