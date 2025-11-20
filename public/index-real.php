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
    <link rel="stylesheet" href="/css/style.css?v=20251119">
    <style>
        /* Styles spécifiques pour le sélecteur de signalement */
        #reportTarget {
            position: absolute;
            bottom: 60px; /* Au-dessus du bouton Report */
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 300px;
            padding: 10px;
            background-color: #2c3e50;
            color: white;
            border: 1px solid #c0392b;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            display: none; /* Caché par défaut */
            font-size: 1em; 
            min-height: 150px;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            cursor: pointer;
        }
        #reportTarget.visible {
            display: block;
        }

        /* Champ de texte pour la raison "Autre" */
        #otherReasonContainer {
            position: absolute;
            bottom: 60px; 
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            max-width: 300px;
            padding: 10px;
            background-color: #2c3e50;
            border: 1px solid #3498db;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 1005; /* Au-dessus du sélecteur */
            display: none; /* Caché par défaut */
        }
        #otherReasonInput {
            width: 100%;
            padding: 8px;
            margin-top: 5px;
            border-radius: 4px;
            border: 1px solid #3498db;
            background-color: #1c1c1c;
            color: white;
        }
        #submitOtherReason {
            background-color: #3498db;
            color: white;
            padding: 8px 15px;
            border: none;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
            width: 100%;
        }

        /* Style pour les options, pour éviter les cercles/carrés de sélection (si le navigateur les affiche) */
        #reportTarget option {
            padding: 8px;
            border-bottom: 1px solid #34495e;
            background-color: #2c3e50;
            color: white;
            cursor: pointer;
        }
        #reportTarget option:hover {
            background-color: #34495e;
        }
        /* Style pour la barre supérieure (topBar) */
        #topBar {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding: 10px;
            color: white;
            text-align: center;
            font-weight: bold;
            background-color: #2980b9; /* Couleur de base */
            z-index: 10000;
        }
    </style>
</head>
<body>

    <div id="topBar">Chargement...</div>

    <div id="videoGrid">
        <video id="localVideo" muted autoplay playsinline></video>
        <video id="remoteVideo" autoplay playsinline></video>
    </div>

    <div id="controls">
        
        <p class="warning-ip">
            <span style="color: red; font-size: 14px;">⚠️ Votre IP est visible et loguée. Visage visible et navigation privée requis !</span>
        </p>

        <div class="control-row">
            <button class="control-button green" id="btnConsentement">👍 Consentement</button>
            <button class="control-button purple" id="btnVibre">🔔 Vibre</button>
        </div>

        <div class="control-row full-width-row">
            <button class="control-button red" id="btnReport">🚩 Signaler</button>
        </div>

        <div class="control-row">
            <select class="control-select yellow" id="cameraSelect">
                <option value="camera 1, facing front">camera 1, facing front</option>
            </select>
            <button class="control-button small-icon" id="muteButton">🔇</button>
        </div>

        <div class="control-row full-width-row">
            <button id="btnNext" disabled class="control-button blue">
                ➔ Interlocuteur suivant
            </button>
        </div>

        <select id="reportTarget"></select>
    </div>

    <!-- NOUVEAU CONTENEUR POUR LA RAISON "AUTRE" -->
    <div id="otherReasonContainer">
        <label for="otherReasonInput">Décrivez brièvement le problème :</label>
        <input type="text" id="otherReasonInput" maxlength="100" placeholder="Ex: Musique trop forte, écran noir..." aria-label="Description du motif Autre">
        <button id="submitOtherReason">Envoyer le signalement</button>
    </div>
    <!-- FIN DU NOUVEAU CONTENEUR -->

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
    
    <!-- SCRIPT DE BASE (gestion des imports de match.js et autres) -->
    <script type="module">
        import { initMatch, nextMatch, bindMatchEvents } from '/js/match.js';
        import { listCameras, startCamera } from "/js/camera.js"; 

        // Rendre nextMatch et showTopbar globaux pour l'usage dans le script non-module (ou pour d'autres modules)
        window.nextMatch = nextMatch;
        window.showTopbar = (message, color = '#2980b9') => {
            const topBar = document.getElementById("topBar");
            topBar.textContent = message;
            topBar.style.backgroundColor = color;
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            // Initialisation de la caméra/liste
            listCameras(); 
            const select = document.getElementById('cameraSelect');
            select.addEventListener('change', () => {
                const deviceId = select.value;
                if (deviceId) {
                    startCamera(deviceId);
                }
            });

            // Initialisation du matching PeerJS
            initMatch();
            bindMatchEvents();
        });
    </script>

    <!-- SCRIPT DE SIGNALEMENT (Contenu de report.js intégré ici) -->
    <script>
        
        const MAX_HISTORY = 5;
        window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {}; 
        window.currentPartnerId = null; 
        window.myPeerId = null; 
        window.currentSessionId = null; 

        /**
         * Met à jour l'historique des interlocuteurs récents.
         */
        function updateLastPeers(newPeerId) {
            if (!newPeerId) return;
            
            window.lastPeers[newPeerId] = Date.now(); 

            let peerArray = Object.entries(window.lastPeers);
            peerArray.sort((a, b) => b[1] - a[1]); 

            if (peerArray.length > MAX_HISTORY) {
                peerArray = peerArray.slice(0, MAX_HISTORY);
            }
            
            window.lastPeers = Object.fromEntries(peerArray);
            localStorage.setItem('lastPeers', JSON.stringify(window.lastPeers));
        }
        window.updateLastPeers = updateLastPeers; 

        /**
         * Capture une image (snapshot) à partir de l'élément vidéo distant.
         */
        function getRemoteVideoSnapshot() {
            const remoteVideo = document.getElementById('remoteVideo');
            if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
                console.warn("Impossible de prendre la capture: Vidéo distante non active.");
                return ''; 
            }

            const canvas = document.createElement('canvas');
            canvas.width = remoteVideo.videoWidth;
            canvas.height = remoteVideo.videoHeight;
            
            canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
            
            return canvas.toDataURL('image/jpeg', 0.8); 
        }

        /**
         * Fonction unifiée pour envoyer le rapport au serveur.
         */
        async function sendReport(partnerId, reason, imageBase64) {
            const callerId = window.myPeerId;
            const sessionId = window.currentSessionId || 'N/A';

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

            try {
                const response = await fetch('/api/report-handler.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });
                const data = await response.json();
                
                if (data.status === 'success') {
                    window.showTopbar(`✅ Signalement de ${partnerId} pour ${reason} envoyé !`, "#0a0");
                } else {
                    window.showTopbar(`❌ Échec de l'enregistrement: ${data.message || 'Erreur inconnue'}`, "#a00");
                }
            } catch (err) {
                window.showTopbar("❌ Erreur réseau lors du signalement.", "#a00");
                console.error("Report Error:", err);
            }
        }
        
        // Initialisation de la logique de signalement
        document.addEventListener('DOMContentLoaded', () => {
            const btnReport = document.getElementById('btnReport');
            const reportTargetSelect = document.getElementById('reportTarget');
            const otherReasonContainer = document.getElementById('otherReasonContainer');
            const otherReasonInput = document.getElementById('otherReasonInput');
            const submitOtherReason = document.getElementById('submitOtherReason');

            let report_peerId = null;
            let report_reason = null;

            // Définition des raisons pour une meilleure gestion
            const reasons = [
                { value: "Nudite", label: "Nudité (Violation de cadrage)" },
                { value: "Sexuel", label: "Comportement sexuel / explicite" },
                { value: "Harcèlement", label: "Harcèlement, Insultes, Discrimination" },
                { value: "Mineur", label: "Suspicion de minorité" },
                { value: "Fraude", label: "Fraude (Bot, Deepfake)" },
                { value: "Autre", label: "Autre (nécessite une description)" } // Libellé mis à jour
            ];
            
            // --- Fonction pour construire la liste des interlocuteurs (Étape 1) ---
            function buildPeerOptions() {
                const peerHistory = window.lastPeers; 
                let optionsHTML = '<option value="" disabled selected>👤 Étape 1 : Choisir l\'interlocuteur</option>';

                const sortedPeers = Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]);
                
                sortedPeers.forEach(id => {
                    const isCurrent = (id === window.currentPartnerId) ? ' (Actif)' : '';
                    const timeAgoMs = Date.now() - peerHistory[id];
                    const timeAgoSec = Math.floor(timeAgoMs / 1000);
                    let timeText;

                    if (timeAgoSec < 60) {
                        timeText = `il y a ${timeAgoSec} sec`;
                    } else {
                        const timeAgoMin = Math.floor(timeAgoSec / 60);
                        timeText = `il y a ${timeAgoMin} min`;
                    }
                    
                    optionsHTML += `<option value="ID|${id}">🕒 ${timeText}${isCurrent}</option>`;
                });
                
                optionsHTML += '<option value="" disabled>────────────────────────</option>';
                
                reasons.forEach(r => {
                    optionsHTML += `<option value="REASON|${r.value}" disabled>${r.label}</option>`;
                });
                
                reportTargetSelect.innerHTML = optionsHTML;
            }

            // --- Fonction pour construire la liste des raisons (Étape 2) ---
            function buildReasonOptions() {
                let optionsHTML = '<option value="" disabled selected>🚨 Étape 2 : Choisir la raison</option>';
                
                optionsHTML += `<option value="" disabled>Signaler l'interlocuteur (ID: ${report_peerId.substring(0, 8)}...)</option>`;
                optionsHTML += '<option value="" disabled>────────────────────────</option>';
                
                reasons.forEach(r => {
                    optionsHTML += `<option value="REASON|${r.value}">${r.label}</option>`;
                });
                
                reportTargetSelect.innerHTML = optionsHTML;
            }

            // --- Étape 1: Afficher le sélecteur d'interlocuteur ---
            btnReport.addEventListener('click', () => {
                // S'assurer que le champ "Autre" est masqué si on ouvre le menu
                otherReasonContainer.style.display = 'none';

                const peerHistoryCount = Object.keys(window.lastPeers).length;
                
                if (peerHistoryCount === 0) {
                    window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
                    reportTargetSelect.classList.remove('visible');
                    return;
                }

                reportTargetSelect.classList.toggle('visible');

                if (reportTargetSelect.classList.contains('visible')) {
                    report_peerId = null;
                    report_reason = null;
                    buildPeerOptions();
                    window.showTopbar(`Sélectionnez un interlocuteur parmi les ${peerHistoryCount} derniers.`, "#2ecc71");
                }
            });

            // --- Gestion des sélections (ID et Raison) ---
            reportTargetSelect.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                
                if (selectedValue.startsWith('ID|')) {
                    // Étape 1 : ID sélectionné
                    report_peerId = selectedValue.substring(3);
                    window.showTopbar(`Interlocuteur sélectionné ! Maintenant, choisissez la raison.`, "#f1c40f");
                    buildReasonOptions();
                    return; 
                } 
                
                if (selectedValue.startsWith('REASON|')) {
                    // Étape 2 : Raison sélectionnée
                    report_reason = selectedValue.substring(7);

                    if (!report_peerId) {
                         window.showTopbar("⚠ Choisissez d'abord l'interlocuteur.", "#fbbf24");
                         // Remettre la sélection sur l'option par défaut de l'étape 2 (raison)
                         event.target.value = event.target.options[0].value;
                         return;
                    }

                    // --- Cas spécial "AUTRE" : Afficher le champ de texte ---
                    if (report_reason === 'Autre') {
                        reportTargetSelect.classList.remove('visible');
                        otherReasonContainer.style.display = 'block';
                        otherReasonInput.focus();
                        window.showTopbar("Décrivez votre motif 'Autre' et envoyez.", "#3498db");
                        return; // On arrête ici, l'envoi se fera via le bouton 'submitOtherReason'
                    }

                    // --- Cas général : Envoi immédiat (Autres motifs) ---
                    const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : ''; 
                    
                    await sendReport(report_peerId, report_reason, imageBase64);
                    
                    // Réinitialiser et masquer
                    reportTargetSelect.classList.remove('visible');
                    report_peerId = null;
                    report_reason = null;
                }
            });

            // --- Gestion du bouton d'envoi pour le motif "Autre" ---
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

                    // Réinitialiser et masquer
                    otherReasonContainer.style.display = 'none';
                    otherReasonInput.value = '';
                    report_peerId = null;
                    report_reason = null;
                } else {
                     window.showTopbar("❌ Erreur: Tentative d'envoi 'Autre' sans ID de pair.", "#a00");
                }
            });

        });
    </script>
</body>
</html>

