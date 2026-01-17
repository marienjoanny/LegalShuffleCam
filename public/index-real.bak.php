<?php
// /public/index-real.php
// Vue principale de l'application de chat vidéo avec contrôles et modération.
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LegalShuffleCam - Chat Vidéo Aléatoire Sécurisé</title>
    <link rel="stylesheet" href="/css/style.css?v=20251122"> 
</head>
<body>

    <div id="topBar">Chargement...</div>

    <canvas id="screenshotCanvas" style="display: none;"></canvas>

    <div id="remoteVideoContainer">
        <div id="videoObscuredMessage" style="position: absolute; color: white; background-color: rgba(0, 0, 0, 0.8); padding: 20px; border-radius: 8px; text-align: center; font-weight: bold; font-size: 1.1em; display: none;">
            Vidéo masquée ! Revenez sur l'onglet pour continuer.
        </div>
        <video id="remoteVideo" autoplay playsinline></video>
    </div>

    <p class="warning-ip">
        <span style="color: red; font-size: 14px; font-weight: bold;">
            ⚠️ VISAGE VISIBLE ! Votre IP est loguée ! Navigation Privée OBLIGATOIRE ! L'enregistrement est illégal !!
        </span>
        <span id="my-peer-id" style="color: #ccc; font-size: 10px; margin-left: 10px;">ID Peer: En attente...</span>
    </p>

    <div id="bottomLayout">
        <div id="controls">
            <div class="control-row">
                <button class="control-button green" id="btnConsentement">👍 Consentement</button>
                <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
            </div>

            <div class="control-row full-width-row">
                <button class="control-button red" id="btnReport" data-partner-id="" data-session-id="">🚩 Signaler</button>
            </div>

            <div class="control-row">
                <select class="control-select yellow" id="cameraSelect">
                    <option value="">Chargement...</option>
                </select>
                <button class="control-button small-icon red" id="muteButton">🔇</button>
            </div>

            <div class="control-row full-width-row">
                <button id="btnNext" disabled class="control-button blue">
                    ➔ Interlocuteur suivant
                </button>
            </div>
        </div>

        <div id="localVideoContainer">
            <video id="localVideo" muted autoplay playsinline></video>
        </div>
    </div>

    <div id="localConsentModal" class="modal-overlay">
        <div class="modal-content">
            <h3>Je consens à désactiver le blocage visage pour un moment spécial avec un inconnu.</h3>
            <div class="modal-buttons">
                <button class="btn-yes" id="localConsentYes">Oui</button>
                <button class="btn-no" id="localConsentNo">Non</button>
            </div>
        </div>
    </div>

    <div id="remoteConsentModal" class="modal-overlay">
        <div class="modal-content">
            <h3>Consentez-vous à désactiver le blocage visage pour un moment spécial avec un inconnu ?</h3>
            <p id="consentPartnerMessage" style="color:#3498db;"></p>
            <div class="modal-buttons">
                <button class="btn-yes" id="remoteConsentYes">Oui</button>
                <button class="btn-no" id="remoteConsentNo">Non</button>
            </div>
        </div>
    </div>

    <select id="reportTarget" size="5"></select>

    <div id="otherReasonContainer">
        <label for="otherReasonInput">Décrivez brièvement le problème :</label>
        <input type="text" id="otherReasonInput" maxlength="100" placeholder="Ex: Musique trop forte, écran noir..." aria-label="Description du motif Autre">
        <button id="submitOtherReason">Envoyer le signalement</button>
    </div>

    <div id="footer">
        <p>
            <a href="/accessibilite.php">Accessibilité</a> |
            <a href="/cgu.php">CGU</a> |
            <a href="/contact.php">Contact</a> |
            <a href="/confidentialite.php">Confidentialité</a> |
            <a href="/cookies.php">Cookies</a> |
            <a href="/mentions-legales.php">Mentions légales</a> |
            <a href="/fonctionnement.php">Fonctionnement</a> |
            <a href="/moderation.php">Modération</a> |
            <a href="/reglement.php">Règlement</a> |
            <a href="/plan-du-site.php">Plan du site</a> |
            <a href="/annuaire.php">Annuaire</a> |
            <a href="/signalements.php">Signalements</a>
        </p>
        <p>
            <a href="https://github.com/marienjoanny/LegalShuffleCam" target="_blank">🔗 Voir le dépôt GitHub</a>
        </p>
    </div>

    <!-- Scripts externes -->
    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
    <script src="/js/tracking-min.js"></script>
    <script src="/js/face-min.js"></script>

    <!-- Scripts internes -->
    <script src="/js/utilities.js"></script>
    <script src="/js/ui-enhancements.js"></script>
    <script src="/js/camera.js"></script>
    <!-- Charger match.js AVANT face-visible.js -->
    <script src="/js/match.js"></script>
    <script src="/js/face-visible.js"></script>
    <script src="/js/signalement.js"></script>
    <script type="module" src="/app-lite.js"></script>

    <!-- Intégration modals consentement -->
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const localModal = document.getElementById("localConsentModal");
        const remoteModal = document.getElementById("remoteConsentModal");

        document.getElementById("localConsentYes").addEventListener("click", () => {
          window.mutualConsentGiven = true;
          localModal.style.display = "none";
        });
        document.getElementById("localConsentNo").addEventListener("click", () => {
          window.mutualConsentGiven = false;
          localModal.style.display = "none";
        });

        document.getElementById("remoteConsentYes").addEventListener("click", () => {
          window.mutualConsentGiven = true;
          remoteModal.style.display = "none";
        });
        document.getElementById("remoteConsentNo").addEventListener("click", () => {
          window.mutualConsentGiven = false;
          remoteModal.style.display = "none";
        });
      });
    </script>
</body>
</html>
