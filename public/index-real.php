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
    <link rel="stylesheet" href="/css/style.css">
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
document.addEventListener('DOMContentLoaded', () => {
    const btnReport = document.getElementById('btnReport');
    const reportTargetSelect = document.getElementById('reportTarget');
    
    // --- Étape 1: Afficher les options de signalement ---
    btnReport.addEventListener('click', () => {
        const partnerId = window.currentPartnerId; 
        
        if (!partnerId) {
            showTopbar("⚠ Aucun interlocuteur actif à signaler.", "#fbbf24");
            reportTargetSelect.classList.remove('visible');
            return;
        }

        // Si un partenaire est là, basculer l'affichage du sélecteur
        reportTargetSelect.classList.toggle('visible');

        // Remplir le sélecteur d'options
        if (reportTargetSelect.classList.contains('visible')) {
            reportTargetSelect.innerHTML = `
                <option value="" disabled selected>Signaler l'ID: ${partnerId}</option>
                <option value="Nudite">Nudité (Violation de cadrage)</option>
                <option value="Sexuel">Comportement sexuel / explicite</option>
                <option value="Harcèlement">Harcèlement, Insultes, Discrimination</option>
                <option value="Mineur">Suspicion de minorité</option>
                <option value="Fraude">Fraude (Bot, Deepfake)</option>
                <option value="Autre">Autre</option>
            `;
        }
    });

    // --- Étape 2: Envoyer le signalement lorsque l'utilisateur sélectionne une raison ---
    reportTargetSelect.addEventListener('change', async (event) => {
        const reason = event.target.value;
        const callerId = window.myPeerId;
        const partnerId = window.currentPartnerId;

        const imageBase64 = getRemoteVideoSnapshot(); 

        if (!callerId || !partnerId) {
             showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
             reportTargetSelect.classList.remove('visible');
             return;
        }
        
        showTopbar(`⏳ Envoi du signalement pour : ${reason}`, "#fbbf24");

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
                showTopbar("✅ Signalement envoyé. Interlocuteur suivant...", "#0a0");
                if (typeof nextMatch === 'function') {
                    nextMatch(); 
                }
            } else {
                showTopbar("❌ Échec de l'enregistrement du signalement.", "#a00");
            }
        } catch (err) {
            showTopbar("❌ Erreur réseau lors du signalement.", "#a00");
            console.error("Report Error:", err);
        }

        reportTargetSelect.classList.remove('visible');
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
