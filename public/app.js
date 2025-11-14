<!DOCTYPE html>
<html>
<head>
    <title>Test Caméra</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        video { width: 320px; height: 240px; background: #000; margin: 10px 0; border: 1px solid #ccc; }
        select { padding: 8px; margin: 10px 0; }
        button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
        #topBar { padding: 10px; background: #f0f0f0; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div id="topBar">Initialisation...</div>
    <video id="localVideo" autoplay playsinline muted></video>
    <select id="cameraSelect"></select>
    <button id="btnNext" disabled>Interlocuteur suivant</button>

    <script>
        // Variables globales
        let currentStream = null;
        const topBar = document.getElementById('topBar');
        const localVideo = document.getElementById('localVideo');
        const cameraSelect = document.getElementById('cameraSelect');
        const btnNext = document.getElementById('btnNext');

        // Fonction pour mettre à jour la barre supérieure
        function updateTopBar(message) {
            if (topBar) topBar.textContent = message;
        }

        // Fonction pour lister les caméras disponibles
        async function listCameras() {
            try {
                updateTopBar("Recherche des caméras disponibles...");

                // Vérification des permissions
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = devices.filter(d => d.kind === 'videoinput');

                console.log('Caméras disponibles:', videoInputs);

                if (cameraSelect) {
                    cameraSelect.innerHTML = '';
                    videoInputs.forEach((device, index) => {
                        const option = document.createElement('option');
                        option.value = device.deviceId;
                        option.textContent = device.label || `Caméra ${index + 1}`;
                        cameraSelect.appendChild(option);
                    });
                }

                if (videoInputs.length > 0) {
                    await startCamera(videoInputs[0].deviceId);
                } else {
                    updateTopBar("Aucune caméra détectée.");
                }
            } catch (err) {
                console.error("Erreur lors de la liste des caméras:", err);
                updateTopBar("Erreur lors de la détection des caméras.");
            }
        }

        // Fonction pour démarrer une caméra
        async function startCamera(deviceId) {
            try {
                // Arrêter le flux actuel s'il existe
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }

                updateTopBar("Demande d'accès à la caméra...");

                // Demander l'accès à la caméra
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: deviceId ? { deviceId: { exact: deviceId } } : true,
                    audio: false // Désactivé pour simplifier
                });

                // Stocker le flux et l'afficher
                currentStream = stream;
                if (localVideo) {
                    localVideo.srcObject = stream;
                    console.log('Flux vidéo local affiché avec succès.');
                    updateTopBar("Caméra active.");
                    btnNext.disabled = false;
                } else {
                    console.error('Élément localVideo introuvable dans le DOM.');
                    updateTopBar("Élément vidéo introuvable.");
                }
            } catch (err) {
                console.error("Erreur lors de l'accès à la caméra:", err);
                let userMessage = "Caméra refusée ou indisponible.";
                if (err.name === 'NotAllowedError') {
                    userMessage = "Accès caméra refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.";
                } else if (err.name === 'NotFoundError') {
                    userMessage = "Aucune caméra trouvée.";
                }
                updateTopBar(userMessage);
                currentStream = null;
                btnNext.disabled = true;
            }
        }

        // Gestion des événements DOM
        if (cameraSelect) {
            cameraSelect.addEventListener('change', (e) => {
                console.log('Changement de caméra:', e.target.value);
                startCamera(e.target.value);
            });
        }

        // Initialisation au chargement de la page
        window.addEventListener('load', () => {
            console.log('Page chargée, démarrage de la détection des caméras...');
            listCameras();

            window.addEventListener('beforeunload', () => {
                if (currentStream) {
                    currentStream.getTracks().forEach(track => track.stop());
                }
            });
        });
    </script>
</body>
</html>