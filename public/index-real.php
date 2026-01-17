<?php
// index-real.php - Version Clean (CSS externes + Protection Flou + Sélecteur Cam)
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
    /* On garde juste le topBar ici car il est très spécifique à cette page */
    #topBar { position: fixed; top: 0; left: 0; width: 100%; padding: 10px; color: white; text-align: center; font-weight: bold; background-color: #e74c3c; z-index: 10000; }
  </style>
</head>
<body>
  <div id="topBar">Initialisation caméra...</div>

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
        Vous restez responsable du contenu diffusé.
      </p>
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
    const MIN_FACE_RATIO = 0.25; 
    const MAX_VALID_AGE = 2500;
    window.mutualConsentGiven = false;

    function showTopbarLog(msg, color) {
        topBar.textContent = msg;
        if(color) topBar.style.color = color;
    }

    // --- MOTEUR DE DÉTECTION (Tracker) ---
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

        // LOGIQUE DE PROTECTION DYNAMIQUE
        if(window.mutualConsentGiven || isFaceValid) {
            localVideo.style.border = "4px solid #2ecc71";
            showTopbarLog(window.mutualConsentGiven ? "Consentement OK ✅" : "Visage OK ✅", "#1abc9c");
            btnNext.disabled = false;
            btnNext.classList.remove('btn-locked');
            if(remoteVideo) remoteVideo.classList.remove('video-protected');
        } else {
            localVideo.style.border = "4px solid #e74c3c";
            showTopbarLog("Placez votre visage face caméra ❌", "#e67e22");
            btnNext.disabled = true;
            btnNext.classList.add('btn-locked');
            if(remoteVideo) remoteVideo.classList.add('video-protected');
        }
    });

    // --- GESTION DES CAMÉRAS ---
    async function initDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            videoSelect.innerHTML = '';
            devices.filter(d => d.kind === 'videoinput').forEach(device => {
                const opt = document.createElement('option');
                opt.value = device.deviceId;
                opt.text = device.label || `Caméra ${videoSelect.length + 1}`;
                videoSelect.appendChild(opt);
            });
        } catch(e) { console.error("Erreur devices:", e); }
    }

    async function startCamera(id = null) {
        if (window.localStream) window.localStream.getTracks().forEach(t => t.stop());
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: id ? { deviceId: { exact: id } } : true,
                audio: true
            });
            window.localStream = stream;
            localVideo.srcObject = stream;
            showTopbarLog("Webcam prête ✅", "#2ecc71");
            
            // Mise à jour du flux en cours d'appel (PeerJS)
            if (window.currentCall && window.currentCall.peerConnection) {
                const sender = window.currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
                if (sender) sender.replaceTrack(stream.getVideoTracks()[0]);
            }
        } catch (err) {
            showTopbarLog("Erreur caméra : " + err.message, "#e74c3c");
        }
    }

    videoSelect.onchange = () => startCamera(videoSelect.value);
    
    // Initialisation au chargement
    initDevices().then(() => startCamera());

    // --- INTERFACE ---
    document.getElementById('btnConsentement').onclick = () => consentModal.style.display = "flex";
    document.getElementById('btnConsentYes').onclick = () => { window.mutualConsentGiven = true; consentModal.style.display = "none"; };
    document.getElementById('btnConsentNo').onclick = () => { window.mutualConsentGiven = false; consentModal.style.display = "none"; };
    
    document.addEventListener("visibilitychange", () => {
        document.getElementById('videoObscuredMessage').style.display = document.hidden ? "block" : "none";
    });
  </script>
</body>
</html>
