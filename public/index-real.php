<?php
// index-real.php - Version SYNCHRONISÉE ET PROPRE
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>LegalShuffleCam - Stable</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug"> 
  <link rel="stylesheet" href="/css/facestyle.css?v=1768744570">
</head>
<body>
  <div id="topBar">Initialisation...</div>

  <div id="remoteVideoContainer">
    <video id="remoteVideo" autoplay playsinline></video>
  </div>

  <div id="bottomLayout">
    <div id="controls">
      <div class="control-row">
        <button class="control-button green" id="btnConsentement">👍 Consentement</button>
        <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
      </div>
      <div class="control-row">
        <select id="cameraSelect" class="control-button yellow" style="width: 100%; color: black; font-weight: bold; text-align: center; border: 2px solid #f1c40f;"></select>
      </div>
      <div class="control-row">
        <button id="btnNextPeer" disabled class="control-button blue" style="width: 100%; height: 55px; font-weight: bold; margin-top: 5px;">➔ INTERLOCUTEUR SUIVANT</button>
      </div>
    </div>

    <div id="localVideoContainer">
      <video id="localVideo" muted autoplay playsinline></video>
    </div>
  </div>

  <div id="localConsentModal" class="modal-overlay" style="display:none;">
    <div class="modal-content">
      <h3>Consentement mutuel</h3>
      <p>⚠️ Attention : en cliquant sur « Oui », je consens à désactiver le blocage visage.</p>
      <div class="modal-buttons">
        <button id="localConsentYes" class="btn-yes">Oui</button>
        <button id="localConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <div id="remoteConsentModal" class="modal-overlay" style="display:none;">
    <div class="modal-content">
      <h3>Demande de consentement</h3>
      <p>Votre partenaire <span id="consentPartnerMessage"></span> souhaite désactiver le flou.</p>
      <div class="modal-buttons">
        <button id="remoteConsentYes" class="btn-yes">Accepter</button>
        <button id="remoteConsentNo" class="btn-no">Refuser</button>
      </div>
    </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script src="/js/facedetection.js?v=1768745806"></script>
  <script src="/js/match.js?v=<?php echo time(); ?>"></script>
  <script>
    document.addEventListener("DOMContentLoaded", () => { 
      if(typeof bindMatchEvents === "function") bindMatchEvents(); 
      if(typeof initMatch === "function") initMatch(); 
    });
  </script>
</body>
</html>
