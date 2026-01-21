<?php $peerId = bin2hex(random_bytes(8)); ?>
<?php
// index-real.php - Version RESTAURÉE ET PROPRE
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <script>window.myPeerId = "<?php echo $peerId; ?>";</script>
  <meta charset="UTF-8">
  <title>LegalShuffleCam - Stable</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug"> 
  <link rel="stylesheet" href="/css/facestyle.css?v=1768744570">
</head>
<body><div id="peer-id-display" style="display:none;">ID: <?php echo $peerId; ?></div>
  <div id="topBar">ID: <?php echo $peerId; ?></div>

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
        <button id="next-btn" disabled class="control-button blue" style="width: 100%; height: 55px; font-weight: bold; margin-top: 5px;">➔ INTERLOCUTEUR SUIVANT</button>
      </div>
    </div>

    <div id="localVideoContainer">
      <video id="localVideo" muted autoplay playsinline></video>
    </div>
  </div>

  <div id="consentModal" class="modal-overlay">
    <div class="modal-content">
      <h3>Consentement mutuel</h3>
      <p>⚠️ Attention : en cliquant sur « Oui », je consens à désactiver le blocage visage.</p>
      <div class="modal-buttons">
        <button id="btnConsentYes" class="btn-yes">Oui</button>
        <button id="btnConsentNo" class="btn-no">Non</button>
      </div>
    </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
<script src="/js/camera.js"></script>
  <script src="/js/facedetection.js?v=1768745806"></script>
  <script src="/js/match.js?v=<?php echo time(); ?>"></script>
  <script>
  <script>
    document.addEventListener("DOMContentLoaded", async () => {
      console.log("Démarrage système...");
      // On laisse facedetection et camera s'initialiser
      setTimeout(() => {
        if(typeof initPeer === "function") {
          console.log("Lancement PeerJS...");
          initPeer();
        }
      }, 1000);
    });
  </script>
</body>
</html>
