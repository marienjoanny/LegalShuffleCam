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
            <canvas id="faceTrackingCanvas" style="display:none;"></canvas>
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

    <script src="https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tracking/build/tracking-min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/tracking/build/data/face-min.js"></script>

    <script type="module" src="/js/camera.js"></script>
    <script type="module" src="/js/face-visible.js"></script>
    <script type="module" src="/js/match.js"></script>

    <script type="module" src="/app-lite.js"></script>

    <script>
        // Fonction showTopbar par défaut
        window.showTopbar = window.showTopbar || function(message, color) {
            console.log(`[TOPBAR] ${message}`);
            const topBar = document.getElementById("topBar");
            if (topBar) topBar.textContent = message;
        };
        
        // Fonction globale pour mettre à jour l'ID Peer dans l'interface
        window.updatePeerIdDisplay = (id) => {
            const el = document.getElementById('my-peer-id');
            if (el) {
                el.textContent = `ID Peer: ${id.substring(0, 10)}...`;
            }
            window.myPeerId = id;
            document.getElementById('btnReport').setAttribute('data-session-id', window.currentSessionId || `Manual_${Date.now()}`);
        };

        const MAX_HISTORY = 5;
        window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {};

        window.updateLastPeers = (newPeerId) => {
            if (!newPeerId || newPeerId === window.myPeerId) return;
            window.lastPeers[newPeerId] = Date.now();
            let peerArray = Object.entries(window.lastPeers);
            peerArray.sort((a, b) => b[1] - a[1]);
            if (peerArray.length > MAX_HISTORY) {
                peerArray = peerArray.slice(0, MAX_HISTORY);
            }
            window.lastPeers = Object.fromEntries(peerArray);
            localStorage.setItem('lastPeers', JSON.stringify(window.lastPeers));
            if (document.getElementById('reportTarget').classList.contains('visible') && typeof window.buildPeerOptions === 'function') {
                window.buildPeerOptions();
            }
        };
    </script>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const remoteVideo = document.getElementById('remoteVideo');
            const videoObscuredMessage = document.getElementById('videoObscuredMessage');

            // Mesures de dissuasion
            document.addEventListener('contextmenu', (e) => { e.preventDefault(); });
            document.addEventListener('keydown', (e) => {
                // Bloque F12, Ctrl+Shift+I/Meta+Shift+I pour empêcher l'ouverture des DevTools
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.shiftKey && e.key === 'I')) {
                    e.preventDefault();
                }
            });

            // Masquage de la vidéo si l'onglet n'est pas actif
            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState === 'hidden') {
                    remoteVideo.style.opacity = '0';
                    remoteVideo.style.pointerEvents = 'none';
                    videoObscuredMessage.style.display = 'block';
                } else {
                    remoteVideo.style.opacity = '1';
                    remoteVideo.style.pointerEvents = 'auto';
                    videoObscuredMessage.style.display = 'none';
                }
            });
        });
    </script>

    <script>
        function getRemoteVideoSnapshot() {
            const remoteVideo = document.getElementById('remoteVideo');
            const canvas = document.getElementById('screenshotCanvas');
            if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
                console.warn("Impossible de prendre la capture: Vidéo distante non active/pas de dimensions.");
                return '';
            }
            canvas.width = remoteVideo.videoWidth;
            canvas.height = remoteVideo.videoHeight;
            canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', 0.8);
        }

        async function sendReport(partnerId, reason, imageBase64) {
            const callerId = window.myPeerId;
            const sessionId = window.currentSessionId;
            if (!callerId || !partnerId) {
                window.showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
                return;
            }
            const formData = new URLSearchParams();
            formData.append('callerId', callerId);
            formData.append('partnerId', partnerId);
            formData.append('reason', reason);
            formData.append('imageBase64', imageBase64);
            formData.append('sessionId', sessionId);
            window.showTopbar(`⏳ Envoi du signalement de ${partnerId}...`, "#f39c12");
            try {
                const response = await fetch('/api/report-handler.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });
                if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
                const data = await response.json();
                if (data.status === 'success') {
                    window.showTopbar(`✅ Signalement de ${partnerId.substring(0, 8)}... pour "${reason}" enregistré !`, "#2ecc71");
                } else {
                    window.showTopbar(`❌ Échec de l'enregistrement: ${data.message || 'Erreur inconnue'}`, "#e74c3c");
                    console.error("Report Handler Error:", data.message);
                }
            } catch (err) {
                window.showTopbar(`❌ Erreur réseau ou serveur. Voir console.`, "#e74c3c");
                console.error("Report Error:", err);
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const btnReport = document.getElementById('btnReport');
            const reportTargetSelect = document.getElementById('reportTarget');
            const otherReasonContainer = document.getElementById('otherReasonContainer');
            const otherReasonInput = document.getElementById('otherReasonInput');
            const submitOtherReason = document.getElementById('submitOtherReason');
            let report_peerId = null;
            let report_reason = null;
            const reasons = [
                { value: "Nudite", label: "Nudité (Violation de cadrage)" },
                { value: "Sexuel", label: "Comportement sexuel / explicite" },
                { value: "Harcèlement", label: "Harcèlement, Insultes, Discrimination" },
                { value: "Mineur", label: "Suspicion de minorité" },
                { value: "Fraude", label: "Fraude (Bot, Deepfake)" },
                { value: "Autre", label: "Autre (nécessite une description)" }
            ];

            function buildPeerOptions() {
                const peerHistory = window.lastPeers;
                const peerHistoryCount = Object.keys(peerHistory).length;
                let optionsHTML = `<option value="" disabled selected>👤 Étape 1 : Choisir l'interlocuteur (${peerHistoryCount} trouvés)</option>`;
                const sortedPeers = Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]);
                sortedPeers.forEach(id => {
                    if (id === window.myPeerId) return;
                    const isCurrent = (id === window.currentPartnerId) ? ' (Actif 🔴)' : '';
                    const timeAgoMs = Date.now() - peerHistory[id];
                    const timeAgoSec = Math.floor(timeAgoMs / 1000);
                    let timeText = timeAgoSec < 60 ? `il y a ${timeAgoSec} sec` : `il y a ${Math.floor(timeAgoSec / 60)} min`;
                    optionsHTML += `<option value="ID|${id}">[${id.substring(0, 8)}] - ${timeText}${isCurrent}</option>`;
                });
                reportTargetSelect.innerHTML = optionsHTML;
                reportTargetSelect.size = Math.min(6, peerHistoryCount + 1);
            }

            function buildReasonOptions() {
                const peerIdShort = report_peerId.substring(0, 8);
                const isCurrent = (report_peerId === window.currentPartnerId) ? ' (Capture vidéo possible)' : '';
                let optionsHTML = `<option value="" disabled selected>🚨 Raison pour ID: ${peerIdShort}...${isCurrent}</option><option value="" disabled>────────────────────────</option>`;
                reasons.forEach(r => {
                    optionsHTML += `<option value="REASON|${r.value}">${r.label}</option>`;
                });
                reportTargetSelect.innerHTML = optionsHTML;
                reportTargetSelect.size = reasons.length + 2;
            }

            btnReport.addEventListener('click', () => {
                if (reportTargetSelect.classList.contains('visible')) {
                    reportTargetSelect.classList.remove('visible');
                    otherReasonContainer.style.display = 'none';
                    window.showTopbar("Signalement annulé.", "#2980b9");
                    report_peerId = null;
                    return;
                }
                otherReasonContainer.style.display = 'none';
                buildPeerOptions();
                const peerHistoryCount = Object.keys(window.lastPeers).length;
                if (peerHistoryCount === 0) {
                    window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
                    return;
                }
                reportTargetSelect.classList.add('visible');
                window.showTopbar(`Sélectionnez un interlocuteur parmi les ${peerHistoryCount} derniers.`, "#2ecc71");
            });

            reportTargetSelect.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                if (selectedValue.startsWith('ID|')) {
                    report_peerId = selectedValue.substring(3);
                    window.showTopbar(`Interlocuteur sélectionné ! Maintenant, choisissez la raison.`, "#f1c40f");
                    buildReasonOptions();
                    event.target.value = event.target.options[0].value;
                    return;
                }
                if (selectedValue.startsWith('REASON|')) {
                    report_reason = selectedValue.substring(7);
                    if (!report_peerId) {
                        window.showTopbar("⚠ Choisissez d'abord l'interlocuteur.", "#fbbf24");
                        event.target.value = event.target.options[0].value;
                        return;
                    }
                    if (report_reason === 'Autre') {
                        reportTargetSelect.classList.remove('visible');
                        otherReasonContainer.style.display = 'block';
                        otherReasonInput.focus();
                        window.showTopbar("Décrivez votre motif 'Autre' et envoyez.", "#3498db");
                        event.target.value = event.target.options[0].value;
                        return;
                    }
                    const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : '';
                    await sendReport(report_peerId, report_reason, imageBase64);
                    reportTargetSelect.classList.remove('visible');
                    report_peerId = null;
                    report_reason = null;
                }
            });

            submitOtherReason.addEventListener('click', async () => {
                const customReason = otherReasonInput.value.trim();
                if (customReason.length < 5) {
                    window.showTopbar("⚠ La description doit contenir au moins 5 caractères.", "#fbbf24");
                    return;
                }
                if (report_peerId && report_reason === 'Autre') {
                    const finalReason = `Autre: ${customReason}`;
                    const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : '';
                    await sendReport(report_peerId, finalReason, imageBase64);
                    otherReasonContainer.style.display = 'none';
                    otherReasonInput.value = '';
                    report_peerId = null;
                    report_reason = null;
                } else {
                    window.showTopbar("❌ Erreur: Tentative d'envoi 'Autre' sans ID de pair ou sans motif.", "#e74c3c");
                }
            });

            window.buildPeerOptions = buildPeerOptions;
        });
    </script>
</body>
</html>
