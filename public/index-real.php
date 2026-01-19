<?php
// index-real.php - Version RESTAURÉE ET PROPRE
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LegalShuffleCam - Stable</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug">
  <link rel="stylesheet" href="/css/facestyle.css?v=<?php echo time(); ?>">
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
      <video id="localVideo" muted autoplay playsinline style="width:100%; background:black;"></video>
    </div>
  </div>

  <div id="consentModal" class="modal-overlay" style="display:none;">
    <div class="modal-content">
      <h3>Consentement mutuel</h3>
      <p>⚠ Attention : en cliquant sur « Oui », je consens à désactiver le blocage visage.</p>
      <div class="modal-buttons">
        <button id="btnConsentYes" class="btn-yes">Oui</button>
        <button id="btnConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script src="/js/facedetection.js?v=<?php echo time(); ?>"></script>
</body>
</html>
