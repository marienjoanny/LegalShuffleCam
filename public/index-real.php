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
            font-size: 1em; /* Assurer une bonne taille de texte */
        }
        #reportTarget.visible {
            display: block;
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
        import { listCameras, startCamera } from "/js/camera.js"; // J'ai remis l'importation de camera.js ici

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
        // La logique de signalement n'a pas besoin de "type=module"
        
        // Variables globales pour l'historique de signalement
        const MAX_HISTORY = 5;
        window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {}; 

        /**
         * Met à jour l'historique des interlocuteurs récents.
         * Rendu global via window.updateLastPeers
         */
        function updateLastPeers(newPeerId) {
            if (!newPeerId) return;
            
            window.lastPeers[newPeerId] = Date.now(); 

            let peerArray = Object.entries(window.lastPeers);
            peerArray.sort((a, b) => b[1] - a[1]); // Trier par timestamp décroissant

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
            // Check
            if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
                return ''; 
            }

            const canvas = document.createElement('canvas');
            canvas.width = remoteVideo.videoWidth;
            canvas.height = remoteVideo.videoHeight;
            
            // Dessin
            canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
            
            return canvas.toDataURL('image/jpeg', 0.8); 
        }

        // Initialisation de la logique de signalement
        document.addEventListener('DOMContentLoaded', () => {
            const btnReport = document.getElementById('btnReport');
            const reportTargetSelect = document.getElementById('reportTarget');
            
            let report_peerId = null;
            let report_reason = null;

            // --- Étape 1: Afficher les options de signalement (IDs et Raisons) ---
            btnReport.addEventListener('click', () => {
                const peerHistory = window.lastPeers; 
                
                if (Object.keys(peerHistory).length === 0) {
                    window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
                    reportTargetSelect.classList.remove('visible');
                    return;
                }

                reportTargetSelect.classList.toggle('visible');

                if (reportTargetSelect.classList.contains('visible')) {
                    let optionsHTML = '<option value="" disabled selected>👤 Choisir l\'interlocuteur à signaler</option>';

                    // Remplir avec les IDs d'interlocuteurs récents
                    Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]).forEach(id => {
                        const isCurrent = (id === window.currentPartnerId) ? ' (Actif)' : '';
                        const timeAgo = (Date.now() - peerHistory[id]) / 60000; // Temps en minutes
                        const timeText = timeAgo < 1 ? 'moins d\'une minute' : `${Math.floor(timeAgo)} min`;
                        optionsHTML += `<option value="ID|${id}">${id}${isCurrent} (${timeText} ago)</option>`;
                    });

                    // Ajouter les raisons de signalement
                    optionsHTML += '<option value="" disabled>--- Raison du signalement ---</option>';
                    optionsHTML += '<option value="REASON|Nudite">Nudité (Violation de cadrage)</option>';
                    optionsHTML += '<option value="REASON|Sexuel">Comportement sexuel / explicite</option>';
                    optionsHTML += '<option value="REASON|Harcèlement">Harcèlement, Insultes, Discrimination</option>';
                    optionsHTML += '<option value="REASON|Mineur">Suspicion de minorité</option>';
                    optionsHTML += '<option value="REASON|Fraude">Fraude (Bot, Deepfake)</option>';
                    optionsHTML += '<option value="REASON|Autre">Autre</option>';
                    
                    reportTargetSelect.innerHTML = optionsHTML;
                }
            });

            // --- Étape 2: Gestion des sélections (ID et Raison) et Envoi ---
            reportTargetSelect.addEventListener('change', async (event) => {
                const selectedValue = event.target.value;
                
                if (selectedValue.startsWith('ID|')) {
                    report_peerId = selectedValue.substring(3);
                    window.showTopbar(`Interlocuteur sélectionné : ${report_peerId}. Choisissez maintenant la raison.`, "#2ecc71");
                    return; 
                } else if (selectedValue.startsWith('REASON|')) {
                    report_reason = selectedValue.substring(7);
                    window.showTopbar(`Raison sélectionnée : ${report_reason}. Tentative d'envoi...`, "#f1c40f");
                } else {
                    return;
                }

                if (report_peerId && report_reason) {
                    const callerId = window.myPeerId;
                    const partnerId = report_peerId;
                    const reason = report_reason;
                    const sessionId = window.currentSessionId || 'N/A';
                    
                    const imageBase64 = (partnerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : ''; 
                    
                    if (!callerId || !partnerId) {
                        window.showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
                        reportTargetSelect.classList.remove('visible');
                        report_peerId = null; 
                        report_reason = null; 
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
                            window.showTopbar("❌ Échec de l'enregistrement du signalement.", "#a00");
                        }
                    } catch (err) {
                        window.showTopbar("❌ Erreur réseau lors du signalement.", "#a00");
                        console.error("Report Error:", err);
                    }

                    // Réinitialiser les états et masquer le sélecteur
                    reportTargetSelect.classList.remove('visible');
                    report_peerId = null;
                    report_reason = null;
                }
            });
        });
    </script>
</body>
</html>