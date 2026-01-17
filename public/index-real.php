<?php
// index-real.php - Version Officielle Stable
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>LegalShuffleCam - Stable</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug">
  <link rel="stylesheet" href="/css/camera.css?v=1.1">
  <link rel="stylesheet" href="/css/modal.css?v=1.1">
  <style>
    #topBar { position: fixed; top: 0; left: 0; width: 100%; padding: 10px; color: white; text-align: center; font-weight: bold; background-color: #e74c3c; z-index: 10000; }
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
        <select id="videoSource"><option value="">Caméra...</option></select>
      </div>
      <div class="control-row">
        <button class="control-button green" id="btnConsentement">👍 Consentement</button>
        <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
      </div>
      <button id="btnNextPeer" disabled class="control-button blue btn-locked">➔ Suivant</button>
    </div>
    <div id="localVideoContainer">
      <video id="localVideo" muted autoplay playsinline></video>
    </div>
  </div>

  <div id="consentModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Consentement</h3>
      <p>Lever la protection ?</p>
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
    const consentModal = document.getElementById('consentModal');

    // On branche l'écouteur d'événements que face-visible.js va envoyer
    window.addEventListener('faceStatusUpdate', (e) => {
        const { isValid, ratio } = e.detail;
        const ratioDisplay = (ratio * 100).toFixed(1);

        if(window.mutualConsentGiven || isValid) {
            topBar.textContent = window.mutualConsentGiven ? "Consentement OK ✅" : `Visage OK (${ratioDisplay}%) ✅`;
            topBar.style.backgroundColor = "#1abc9c";
            btnNext.disabled = false;
            btnNext.classList.remove('btn-locked');
            document.getElementById('remoteVideo').classList.remove('video-protected');
        } else {
            topBar.textContent = `Ratio: ${ratioDisplay}% / Requis: 30% ❌`;
            topBar.style.backgroundColor = "#e67e22";
            btnNext.disabled = true;
            btnNext.classList.add('btn-locked');
            document.getElementById('remoteVideo').classList.add('video-protected');
        }
    });

    // Caméra et Initialisation
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => { 
          localVideo.srcObject = stream;
          localVideo.onplaying = () => {
              if(typeof window.initFaceDetection === 'function') {
                  window.initFaceDetection(localVideo);
              }
          };
      })
      .catch(err => { topBar.textContent = "Erreur Caméra"; });

    document.getElementById('btnConsentement').onclick = () => consentModal.style.display = "flex";
    document.getElementById('btnConsentYes').onclick = () => { 
        window.mutualConsentGiven = true; 
        consentModal.style.display = "none"; 
    };
  </script>
</body>
</html>
