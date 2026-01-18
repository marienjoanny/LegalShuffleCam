<?php
// index-real.php - Copie exacte du code de test fonctionnel (Nettoyé des échecs précédents)
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Index Real Test - Détection Faciale Debug + Consentement CGU</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug"> 
  <style>
    .modal-overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 20000;
    }
    .modal-content {
      background: #2c3e50;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      color: #fff;
      text-align: center;
      box-shadow: 0 0 15px rgba(0,0,0,0.5);
    }
    .modal-buttons {
      margin-top: 20px;
      display: flex;
      justify-content: space-around;
    }
    .btn-yes {
      background-color: #27ae60;
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    .btn-no {
      background-color: #c0392b;
      color: #fff;
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    /* Ajout du style topBar pour que le feedback s'affiche correctement */
    #topBar {
        position: fixed; top: 0; left: 0; width: 100%; padding: 10px; color: white; text-align: center; font-weight: bold; background-color: #e74c3c; z-index: 10000;
    }
  </style>
</head>
<body>
  <div id="topBar">Initialisation...</div>

  <div id="remoteVideoContainer">
    <div id="videoObscuredMessage" style="position: absolute; color: white; background-color: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1em; display: none;">
      Vidéo masquée ! Revenez sur l'onglet pour continuer.
    </div>
    <video id="remoteVideo" autoplay playsinline></video>
  </div>

  <div id="bottomLayout">
    <div id="controls">
      <div class="control-row">
        <button class="control-button green" id="btnConsentement">👍 Consentement</button>
        <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
      </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue">
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
      <p style="text-align: justify; font-size: 0.95em; color:#e74c3c; font-weight:bold;">
        ⚠️ Attention : en cliquant sur « Oui », je consens à désactiver le blocage visage.<br><br>
        Je reconnais que :
      </p>
      <ul style="text-align: left; font-size: 0.9em; padding-left: 20px; color:#fff; font-weight:normal;">
        <li>Ces échanges restent privés, non enregistrés, et sous ma responsabilité exclusive.</li>
        <li>Le contenu diffusé est sous la responsabilité des utilisateurs.</li>
        <li>Deux utilisateurs majeurs peuvent, après double confirmation, débloquer l’affichage complet de leur vidéo.</li>
        <li>Ce consentement est horodaté et conservé uniquement en cas de signalement ou de litige.</li>
        <li>En cas d’usage abusif ou illégal, l’éditeur peut transmettre les informations de connexion aux autorités compétentes.</li>
      </ul>
      <div class="modal-buttons">
        <button id="btnConsentYes" class="btn-yes">Oui</button>
        <button id="btnConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <div id="footer">
    <p>
      <a href="/cgu.php">CGU</a> |
      <a href="/contact.php">Contact</a> |
      <a href="/confidentialite.php">Confidentialité</a> |
      <a href="/mentions-legales.php">Mentions légales</a>
    </p>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script>
    const localVideo = document.getElementById('localVideo');
    const topBar = document.getElementById('topBar');
    const btnNext = document.getElementById('btnNextPeer');
    const btnConsentement = document.getElementById('btnConsentement');
    const videoObscuredMessage = document.getElementById('videoObscuredMessage');
    const consentModal = document.getElementById('consentModal');
    const btnConsentYes = document.getElementById('btnConsentYes');
    const btnConsentNo = document.getElementById('btnConsentNo');

    let lastAcceptedTime = 0;
    let lastAcceptedRects = [];
    const MIN_FACE_RATIO = 0.3;
    const MAX_VALID_AGE = 2000;
    window.mutualConsentGiven = false;

    function showTopbarLog(msg, color) {
      topBar.textContent = msg;
      if(color) topBar.style.color = color;
    }

    function updateBorder(color) {
      localVideo.style.border = `4px solid ${color}`;
      localVideo.style.boxShadow = `0 0 10px ${color}`;
    }

    const tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);
    tracking.track('#localVideo', tracker);

    tracker.on('track', event => {
      const now = Date.now();
      const videoArea = (localVideo.videoWidth * localVideo.videoHeight) || 1;

      if(event.data.length > 0){
        event.data.forEach(rect => {
          const faceArea = rect.width * rect.height;
          const ratio = faceArea / videoArea;
          if(ratio >= MIN_FACE_RATIO){
            lastAcceptedRects = [rect];
            lastAcceptedTime = now;
          }
        });
      }

      const age = now - lastAcceptedTime;

      if(window.mutualConsentGiven){
        updateBorder("#3498db");
        showTopbarLog("Consentement mutuel donné ✅", "#3498db");
        btnNext.disabled = false;
        return;
      }

      if(lastAcceptedRects.length > 0 && age < MAX_VALID_AGE){
        updateBorder("#2ecc71");
        showTopbarLog("Visage détecté (≥30%) ✅", "#1abc9c");
        btnNext.disabled = false;
      } else {
        updateBorder("#e74c3c");
        showTopbarLog("Rapprochez votre visage (min 30%) ❌ ");
        btnNext.disabled = true;
      }
    });

    navigator.mediaDevices.getUserMedia({ video:true })
      .then(stream => { localVideo.srcObject = stream; showTopbarLog("Webcam initialisée ✅","#0a0"); })
      .catch(err => { showTopbarLog("Erreur webcam ❌ " + err.message,"#a00"); });

    // --- Gestion du bouton consentement ---
    btnConsentement.addEventListener("click", () => {
      consentModal.style.display = "flex";
    });

    btnConsentYes.addEventListener("click", () => {
      window.mutualConsentGiven = true;
      updateBorder("#3498db");
      showTopbarLog("Consentement activé via modal ✅", "#3498db");
      btnNext.disabled = false;
      consentModal.style.display = "none";
    });

    btnConsentNo.addEventListener("click", () => {
      window.mutualConsentGiven = false;
      showTopbarLog("Consentement refusé ❌", "#e67e22");
      btnNext.disabled = true;
      consentModal.style.display = "none";
    });

    // --- Gestion de l'overlay remote ---
    document.addEventListener("visibilitychange", () => {
      if(document.hidden){
        videoObscuredMessage.style.display = "block";
      } else {
        videoObscuredMessage.style.display = "none";
      }
    });
  </script>
</body>
</html>
