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
    <script type="module">
        import { initMatch, nextMatch, bindMatchEvents } from '/js/match.js';

        // Rendre nextMatch global pour pouvoir l'appeler depuis le script de signalement
        window.nextMatch = nextMatch;
        window.showTopbar = (message, color = '#2980b9') => {
            const topBar = document.getElementById("topBar");
            topBar.textContent = message;
            topBar.style.backgroundColor = color;
        };
        
        document.addEventListener('DOMContentLoaded', () => {
            initMatch();
            bindMatchEvents();
        });
    </script>

    <script>
// NOUVEAU: Variables globales pour stocker l'historique et la sélection du signalement
window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {}; 
const MAX_HISTORY = 5;

// NOUVEAU: Fonction pour ajouter un ID à l'historique et maintenir la taille à MAX_HISTORY
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
window.updateLastPeers = updateLastPeers; // Rendre disponible pour match.js

document.addEventListener('DOMContentLoaded', () => {
    const btnReport = document.getElementById('btnReport');
    const reportTargetSelect = document.getElementById('reportTarget');
    
    // NOUVELLES VARIABLES LOCALES POUR LA SÉLECTION EN DEUX ÉTAPES
    let report_peerId = null;
    let report_reason = null;

    // --- Étape 1: Afficher les options de signalement (IDs et Raisons) ---
    btnReport.addEventListener('click', () => {
        const peerHistory = window.lastPeers; 
        
        if (Object.keys(peerHistory).length === 0) {
            showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
            reportTargetSelect.classList.remove('visible');
            return;
        }

        // Basculer l'affichage du sélecteur
        reportTargetSelect.classList.toggle('visible');

        // Remplir le sélecteur
        if (reportTargetSelect.classList.contains('visible')) {
            let optionsHTML = '<option value="" disabled selected>👤 Choisir l\'interlocuteur à signaler</option>';

            // Ajouter les IDs à l'historique (du plus récent au plus ancien)
            Object.keys(peerHistory).forEach(id => {
                const isCurrent = (id === window.currentPartnerId) ? ' (Actif)' : '';
                const timestamp = peerHistory[id];
                const timeAgo = (Date.now() - timestamp) / 1000 / 60; // Temps en minutes
                const timeText = timeAgo < 1 ? 'moins d\'une minute' : `${Math.floor(timeAgo)} min`;

                optionsHTML += `<option value="ID|${id}">${id}${isCurrent} (${timeText} ago)</option>`;
            });

            // Ajouter les raisons de signalement comme options
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

    // --- Étape 2: Gestion des sélections (ID et Raison) ---
    reportTargetSelect.addEventListener('change', async (event) => {
        const selectedValue = event.target.value;
        
        if (selectedValue.startsWith('ID|')) {
            report_peerId = selectedValue.substring(3);
            showTopbar(`Interlocuteur sélectionné : ${report_peerId}. Choisissez maintenant la raison.`, "#2ecc71");
            return; // Ne pas fermer le sélecteur
        } else if (selectedValue.startsWith('REASON|')) {
            report_reason = selectedValue.substring(7);
            showTopbar(`Raison sélectionnée : ${report_reason}. Tentative d'envoi...`, "#f1c40f");
        } else {
            return;
        }

        // --- ENVOI FINAL SI ID ET RAISON SONT DÉFINIS ---
        if (report_peerId && report_reason) {
            const callerId = window.myPeerId;
            const partnerId = report_peerId;
            const reason = report_reason;
            
            // Prendre un snapshot uniquement si le partenaire signalé est le partenaire ACTUEL
            const imageBase64 = (partnerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : ''; 
            
            if (!callerId || !partnerId) {
                 showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
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

            try {
                const response = await fetch('/api/report-handler.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });
                const data = await response.json();
                
                if (data.status === 'success') {
                    showTopbar(`✅ Signalement de ${partnerId} pour ${reason} envoyé !`, "#0a0");
                } else {
                    showTopbar("❌ Échec de l'enregistrement du signalement.", "#a00");
                }
            } catch (err) {
                showTopbar("❌ Erreur réseau lors du signalement.", "#a00");
                console.error("Report Error:", err);
            }

            // Réinitialiser les états et masquer le sélecteur
            reportTargetSelect.classList.remove('visible');
            report_peerId = null;
            report_reason = null;
        }
    });

    // --- Étape 3: Capture d'écran de la vidéo distante ---
    function getRemoteVideoSnapshot() {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
            return ''; 
        }

        const canvas = document.createElement('canvas');
        canvas.width = remoteVideo.videoWidth;
        canvas.height = remoteVideo.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', 0.8); 
    }
});
    </script>
</body>
</html>
