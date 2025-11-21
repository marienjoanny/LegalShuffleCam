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
    <link rel="stylesheet" href="/css/style.css?v=20251121">
    <style>
        /* Styles spécifiques pour le sélecteur de signalement */
        #reportTarget {
            /* Positionnement fixé dans le CSS principal */
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
            text-align: left; 
        }
        #reportTarget.visible {
            display: block;
        }

        /* Champ de texte pour la raison "Autre" */
        #otherReasonContainer {
            /* Positionnement fixé dans le CSS principal */
            padding: 15px; 
            background-color: #2c3e50;
            border: 2px solid #3498db; 
            border-radius: 8px; 
            box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4);
            z-index: 1005; 
            display: none; 
            color: #ecf0f1;
        }
        #otherReasonInput {
            width: 100%;
            padding: 10px;
            margin-top: 8px;
            margin-bottom: 5px;
            border-radius: 4px;
            border: 1px solid #3498db;
            background-color: #1c1c1c;
            color: white;
            box-sizing: border-box; 
        }
        #submitOtherReason {
            background-color: #27ae60; 
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            margin-top: 10px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
        }
        #submitOtherReason:hover {
            background-color: #2ecc71;
        }

        /* Style pour les options */
        #reportTarget option {
            padding: 8px;
            border-bottom: 1px solid #34495e;
            background-color: #2c3e50;
            color: white;
            cursor: pointer;
            white-space: nowrap; 
            overflow: hidden;
            text-overflow: ellipsis;
        }
        #reportTarget option:hover {
            background-color: #34495e;
        }
    </style>
</head>
<body>

    <div id="topBar">Chargement...</div>

    <!-- Canvas temporaire pour la capture d'écran (caché) -->
    <canvas id="screenshotCanvas" style="display: none;"></canvas>

    <!-- ZONE VIDÉO PRINCIPALE (HAUT) -->
    <div id="remoteVideoContainer">
        <video id="remoteVideo" autoplay playsinline></video>
    </div>

    <!-- TEXTE D'AVERTISSEMENT ROUGE (SOUS la cam du haut) -->
    <p class="warning-ip">
        <span style="color: red; font-size: 14px;">⚠️ Votre IP est visible et loguée. Visage visible et navigation privée requis !</span>
    </p>

    <!-- ZONE INFÉRIEURE : CONTRÔLES (GAUCHE) / CAM LOCALE (DROITE) -->
    <div id="bottomLayout">
        
        <!-- CONTRÔLES (GAUCHE) -->
        <div id="controls">
            <!-- Ligne 1: Consentement et Wizz -->
            <div class="control-row">
                <button class="control-button green" id="btnConsentement">👍 Consentement</button>
                <button class="control-button purple" id="btnVibre">🔔 Wizz</button>
            </div>

            <!-- Ligne 2: Signaler -->
            <div class="control-row full-width-row">
                <button class="control-button red" id="btnReport" data-partner-id="" data-session-id="">🚩 Signaler</button>
            </div>

            <!-- Ligne 3: Caméra et Son -->
            <div class="control-row">
                <select class="control-select yellow" id="cameraSelect">
                    <option value="camera 1, facing front">camera 1, facing front</option>
                </select>
                <button class="control-button small-icon" id="muteButton">🔇</button>
            </div>

            <!-- Ligne 4: Interlocuteur Suivant -->
            <div class="control-row full-width-row">
                <button id="btnNext" disabled class="control-button blue">
                    ➔ Interlocuteur suivant
                </button>
            </div>
        </div>

        <!-- CAMÉRA LOCALE (DROITE) -->
        <div id="localVideoContainer">
            <video id="localVideo" muted autoplay playsinline></video> 
        </div>
    </div>
    
    <!-- SÉLECTEUR DE SIGNALEMENT (Flottant au-dessus de tout) -->
    <select id="reportTarget" size="5"></select>

    <!-- CONTENEUR POUR LA RAISON "AUTRE" (Flottant au-dessus de tout) -->
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
        // Le code JS ici est le même que précédemment et gère la logique PeerJS, la caméra, 
        // le signalement et les interactions. Il n'est pas modifié car le changement est purement HTML/CSS.

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

        // Définir les variables globales pour la gestion du pair (mis à jour par match.js)
        window.currentPartnerId = null; 
        window.myPeerId = null; 
        window.currentSessionId = null; 
    </script>

    <!-- SCRIPT DE SIGNALEMENT (Contenu de report.js intégré ici) -->
    <script>
        
        const MAX_HISTORY = 5;
        // La gestion de l'historique doit se faire dans le script qui gère les connexions (match.js)
        // Mais nous laissons ici l'accès et la fonction utilitaire si elle est appelée d'ailleurs.
        window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {}; 

        /**
         * Met à jour l'historique des interlocuteurs récents.
         * Fonction utilitaire, normalement appelée après une connexion ou déconnexion.
         */
        function updateLastPeers(newPeerId) {
            if (!newPeerId) return;
            
            // Évite de lister l'ID deux fois
            if (newPeerId === window.myPeerId) return; 

            window.lastPeers[newPeerId] = Date.now(); 

            let peerArray = Object.entries(window.lastPeers);
            peerArray.sort((a, b) => b[1] - a[1]); 

            if (peerArray.length > MAX_HISTORY) {
                // Garder seulement les MAX_HISTORY plus récents
                peerArray = peerArray.slice(0, MAX_HISTORY);
            }
            
            window.lastPeers = Object.fromEntries(peerArray);
            localStorage.setItem('lastPeers', JSON.stringify(window.lastPeers));
        }
        window.updateLastPeers = updateLastPeers; // Rendre disponible globalement si match.js en a besoin

        /**
         * Capture une image (snapshot) à partir de l'élément vidéo distant.
         * @returns {string} L'image en Base64 JPEG, ou chaîne vide si échec.
         */
        function getRemoteVideoSnapshot() {
            const remoteVideo = document.getElementById('remoteVideo');
            const canvas = document.getElementById('screenshotCanvas');

            if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
                console.warn("Impossible de prendre la capture: Vidéo distante non active/pas de dimensions.");
                return ''; 
            }

            canvas.width = remoteVideo.videoWidth;
            canvas.height = remoteVideo.videoHeight;
            
            // Dessiner la vidéo sur le canvas
            canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
            
            // Retourner l'image en Base64 JPEG pour un meilleur rapport qualité/taille
            return canvas.toDataURL('image/jpeg', 0.8); 
        }

        /**
         * Fonction unifiée pour envoyer le rapport au serveur.
         * @param {string} partnerId L'ID PeerJS du signalé.
         * @param {string} reason Le motif de signalement.
         * @param {string} imageBase64 Capture d'écran en Base64.
         */
        async function sendReport(partnerId, reason, imageBase64) {
            const callerId = window.myPeerId;
            // Utiliser l'ID de session actuel, ou un fallback
            const sessionId = window.currentSessionId || `Manual_${Date.now()}`;

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
                
                // Gérer les erreurs HTTP de bas niveau (ex: 500, 404)
                if (!response.ok) {
                     const errorText = `Erreur HTTP ${response.status} lors de l'envoi du rapport.`;
                     throw new Error(errorText);
                }

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
                { value: "Autre", label: "Autre (nécessite une description)" } 
            ];
            
            // --- Fonction pour construire la liste des interlocuteurs (Étape 1) ---
            function buildPeerOptions() {
                // Utiliser la dernière version de l'historique
                const peerHistory = JSON.parse(localStorage.getItem('lastPeers')) || {}; 
                window.lastPeers = peerHistory; // Synchroniser la globale

                const peerHistoryCount = Object.keys(peerHistory).length;
                let optionsHTML = `<option value="" disabled selected>👤 Étape 1 : Choisir l'interlocuteur (${peerHistoryCount} trouvés)</option>`;

                const sortedPeers = Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]);
                
                sortedPeers.forEach(id => {
                    // Masquer mon propre ID si présent par erreur
                    if (id === window.myPeerId) return; 
                    
                    const isCurrent = (id === window.currentPartnerId) ? ' (Actif 🔴)' : '';
                    const timeAgoMs = Date.now() - peerHistory[id];
                    const timeAgoSec = Math.floor(timeAgoMs / 1000);
                    let timeText;

                    if (timeAgoSec < 60) {
                        timeText = `il y a ${timeAgoSec} sec`;
                    } else {
                        const timeAgoMin = Math.floor(timeAgoSec / 60);
                        timeText = `il y a ${timeAgoMin} min`;
                    }
                    
                    optionsHTML += `<option value="ID|${id}">[${id.substring(0, 8)}] - ${timeText}${isCurrent}</option>`;
                });
                
                reportTargetSelect.innerHTML = optionsHTML;
                // Ajuster la taille pour afficher plus d'options
                reportTargetSelect.size = Math.min(6, peerHistoryCount + 1); 
            }

            // --- Fonction pour construire la liste des raisons (Étape 2) ---
            function buildReasonOptions() {
                const peerIdShort = report_peerId.substring(0, 8);
                const isCurrent = (report_peerId === window.currentPartnerId) ? ' (Capture vidéo possible)' : '';
                
                let optionsHTML = `<option value="" disabled selected>🚨 Raison pour ID: ${peerIdShort}...${isCurrent}</option>`;
                optionsHTML += '<option value="" disabled>────────────────────────</option>';
                
                reasons.forEach(r => {
                    optionsHTML += `<option value="REASON|${r.value}">${r.label}</option>`;
                });
                
                reportTargetSelect.innerHTML = optionsHTML;
                reportTargetSelect.size = reasons.length + 2; 
            }

            // --- Étape 1: Afficher le sélecteur d'interlocuteur ---
            btnReport.addEventListener('click', () => {
                // Si le menu est ouvert et cliqué à nouveau, le fermer (toggle)
                if (reportTargetSelect.classList.contains('visible')) {
                    reportTargetSelect.classList.remove('visible');
                    otherReasonContainer.style.display = 'none';
                    window.showTopbar("Signalement annulé.", "#2980b9");
                    report_peerId = null;
                    return;
                }
                
                // S'assurer que le champ "Autre" est masqué si on ouvre le menu
                otherReasonContainer.style.display = 'none';

                // Reconstruire l'historique avant d'afficher
                buildPeerOptions();
                const peerHistoryCount = Object.keys(window.lastPeers).length;
                
                if (peerHistoryCount === 0) {
                    window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
                    return;
                }

                reportTargetSelect.classList.add('visible'); // Ouvrir le menu
                window.showTopbar(`Sélectionnez un interlocuteur parmi les ${peerHistoryCount} derniers.`, "#2ecc71");
            });

            // --- Gestion des sélections (ID et Raison) ---
            reportTargetSelect.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                
                if (selectedValue.startsWith('ID|')) {
                    // Étape 1 : ID sélectionné
                    report_peerId = selectedValue.substring(3);
                    window.showTopbar(`Interlocuteur sélectionné ! Maintenant, choisissez la raison.`, "#f1c40f");
                    buildReasonOptions();
                    
                    // Réinitialiser la valeur pour ne pas resélectionner l'ID par erreur
                    event.target.value = event.target.options[0].value; 
                    return; 
                } 
                
                if (selectedValue.startsWith('REASON|')) {
                    // Étape 2 : Raison sélectionnée
                    report_reason = selectedValue.substring(7);

                    if (!report_peerId) {
                         window.showTopbar("⚠ Choisissez d'abord l'interlocuteur.", "#fbbf24");
                         event.target.value = event.target.options[0].value;
                         return;
                    }

                    // --- Cas spécial "AUTRE" : Afficher le champ de texte ---
                    if (report_reason === 'Autre') {
                        reportTargetSelect.classList.remove('visible');
                        otherReasonContainer.style.display = 'block';
                        otherReasonInput.focus();
                        window.showTopbar("Décrivez votre motif 'Autre' et envoyez.", "#3498db");
                        // Nettoyer la sélection du select
                        event.target.value = event.target.options[0].value; 
                        return; 
                    }

                    // --- Cas général : Envoi immédiat (Autres motifs) ---
                    // Capture d'écran uniquement si on signale le partenaire ACTUEL
                    const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : ''; 
                    
                    await sendReport(report_peerId, report_reason, imageBase64);
                    
                    // Réinitialiser et masquer l'interface
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

                    // Réinitialiser et masquer l'interface
                    otherReasonContainer.style.display = 'none';
                    otherReasonInput.value = '';
                    report_peerId = null;
                    report_reason = null;
                } else {
                     window.showTopbar("❌ Erreur: Tentative d'envoi 'Autre' sans ID de pair ou sans motif.", "#e74c3c");
                }
            });
            
            // Ajouter la fonction au scope global pour que match.js puisse la forcer
            window.buildPeerOptions = buildPeerOptions;
        });
    </script>
</body>
</html>