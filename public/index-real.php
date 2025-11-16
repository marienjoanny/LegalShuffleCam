<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <style>
    /* ... styles inchangés ... */
  </style>
</head>
<body>
  <div class="top-bar">
    <div class="tab-bar">
      <div class="tabs">
        <div class="tab active" id="tabCam">CAM</div>
        <div class="tab" id="tabGames">JEUX</div>
      </div>
      <div class="loader-ring" id="loaderRing"></div>
    </div>
    <span id="topBar">Initialisation...</span>
  </div>

  <div class="main">
    <div class="video-zone" id="faceFrame">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="warning">⚠ Votre IP est visible et loguée. Visage visible et navigation privée requis !</div>

    <div class="actions">
      <button id="btnConsent" class="green">👍 Consentement</button>
      <button id="btnVibrate" class="purple">🔔 Vibre</button>
      <button id="btnReport" class="red">🚩</button>
      <select id="reportTarget" class="red-select">
        <option disabled selected>Choisir un interlocuteur</option>
      </select>
      <select id="cameraSelect" class="yellow"></select>
      <button id="btnMic" class="green">🔊</button>
      <button id="btnNext" class="blue" disabled>➡️ Interlocuteur suivant</button>
    </div>
  </div>

  <footer>
    <p>
      <a href="/accessibilite.html">Accessibilité</a> •
      <a href="/cgu.html">CGU</a> •
      <a href="/contact.html">Contact</a> •
      <a href="/confidentialite.html">Confidentialité</a> •
      <a href="/cookies.html">Cookies</a> •
      <a href="/mentions-legales.html">Mentions légales</a> •
      <a href="/fonctionnement.html">Fonctionnement</a> •
      <a href="/moderation.html">Modération</a> •
      <a href="/reglement.html">Règlement</a> •
      <a href="/sitemap.html">Plan du site</a> • 
      <a href="/annuaire.php">Annuaire</a> •
      <a href="/reports.php">Signalements</a>
    </p>
    <p style="margin-top:8px;">
      🔗 <a href="https://github.com/marienjoanny/LegalShuffleCam/tree/main/public" target="_blank">Voir le dépôt GitHub</a>
    </p>
    <p style="font-size:11px; margin-top:8px;">
      IP : <?php echo $_SERVER['REMOTE_ADDR'] ?? 'N/A'; ?> •
      UA : <?php echo substr($_SERVER['HTTP_USER_AGENT'] ?? 'N/A', 0, 50); ?>
    </p>
  </footer>

  <!-- Librairie PeerJS -->
  <script src="https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js"></script>

  <!-- Ton app.js optimisé -->
  <script src="/app.js" defer></script>
<script>
    window.addEventListener("load", () => {
      const urlParams = new URLSearchParams(window.location.search);
      const callerId = urlParams.get("callerId");
      const partnerId = urlParams.get("partnerId");
      const peerIdToCall = urlParams.get("peerId");
      const targetId = partnerId || peerIdToCall;

      const tryCall = () => {
        if (
          targetId &&
          typeof window.handleDirectCall === "function" &&
          window.peer &&
          window.peer.id &&
          window.currentStream
        ) {
          if (targetId !== window.peer.id) {
            showMessage(`Appel automatique vers ${targetId}...`);
            window.handleDirectCall(targetId);
          } else {
            showMessage("⚠ Impossible de s'appeler soi-même", true);
          }
        } else {
          setTimeout(tryCall, 500);
        }
      };

      tryCall();
    });
  </script>
</body>
</html>
