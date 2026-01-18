<?php
// index-real.php - Copie exacte du code de test fonctionnel (Nettoyé des échecs précédents)
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Index Real Test - Détection Faciale Debug + Consentement CGU</title>
  <link rel="stylesheet" href="/css/styletest.css?v=debug"> 
  <link rel="stylesheet" href="/css/facestyle.css?v=1768744570">
</head>
<body>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
  <div id="topBar">Initialisation...</div>

  <div id="remoteVideoContainer">
    <div id="videoObscuredMessage" style="position: absolute; color: white; background-color: rgba(0,0,0,0.8); padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1em; display: none;">
      Vidéo masquée ! Revenez sur l'onglet pour continuer.
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
    </div>
    <video id="remoteVideo" autoplay playsinline></video>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
  </div>

  <div id="bottomLayout">
    <div id="controls">
      <div class="control-row">
        <button class="control-button green" id="btnConsentement">👍 Consentement</button>
        <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
      </div>
      <div class="control-row full-width-row">
        <select id="cameraSelect" class="control-button yellow" style="width: 100%; margin-bottom: 5px; color: black; font-weight: bold; text-align: center; border: 2px solid #f1c40f;"></select>
          ➔ Interlocuteur suivant
        </button>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
      </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
    </div>

    <div id="localVideoContainer">
      <video id="localVideo" muted autoplay playsinline></video>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
    </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
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
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
      </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
    </div>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
  </div>

  <div id="footer">
    <p>
      <a href="/cgu.php">CGU</a> |
      <a href="/contact.php">Contact</a> |
      <a href="/confidentialite.php">Confidentialité</a> |
      <a href="/mentions-legales.php">Mentions légales</a>
    </p>
      <div class="control-row full-width-row">
        <button id="btnNextPeer" disabled class="control-button blue btn-next-big">
          ➔ INTERLOCUTEUR SUIVANT
        </button>
      </div>
  </div>

  <script src="/js/tracking-min.js"></script>
  <script src="/js/face-min.js"></script>
  <script src="/js/facedetection.js?v=1768745806"></script>
</body>
</html>
