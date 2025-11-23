// LegalShuffleCam • camera.js (Module ES)
// Gestion de la liste des caméras et du démarrage du flux local.

// LOG: Module /js/camera.js chargé. (Validation obligatoire)
function showTopbarLog(message, color) {
    if (typeof showTopbar === 'function') {
        showTopbar(message, color);
    } else {
        const topBar = document.getElementById("topBar");
        if (topBar) {
            topBar.textContent = message;
        } else {
            console.log(`[TOPBAR-LOG] ${message}`); 
        }
    }
}
showTopbarLog("✅ Module camera.js chargé.");

/**
 * Liste les périphériques vidéo disponibles et peuple le sélecteur.
 */
export async function listCameras() {
    showTopbarLog("🔎 Recherche des caméras disponibles...");
    const select = document.getElementById('cameraSelect');
    if (!select) {
        return;
    }
    
    select.innerHTML = ''; 
    
    try {
        // NOTE IMPORTANTE: Appeler getUserMedia une fois SANS contraintes 
        // est parfois nécessaire pour que enumerateDevices retourne les noms (labels) des périphériques.
        // Si vous ne l'avez pas fait avant, les labels seront vides.
        // On ne le fait pas ici pour éviter de redéclencher les permissions.
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            select.innerHTML = '<option value="">Aucune caméra trouvée</option>';
            select.disabled = true;
            showTopbarLog("❌ Aucune caméra vidéo détectée.");
            return;
        }

        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            // Si l'énumération a réussi à ce stade, les labels devraient être disponibles.
            option.textContent = device.label || `Caméra ${index + 1}`; 
            select.appendChild(option);
            
            if (index === 0) {
                option.selected = true;
            }
        });
        
        select.disabled = false;
        showTopbarLog(`✅ ${videoDevices.length} caméras détectées.`);

    } catch (err) {
        console.error("Erreur lors de l'énumération des périphériques:", err);
        select.innerHTML = '<option value="">Erreur de liste</option>';
        select.disabled = true;
        showTopbarLog("❌ Échec de l'énumération des caméras (permission requise).");
    }
}

/**
 * Démarre un nouveau flux média avec le deviceId spécifié et met à jour
 * le flux local (window.localStream) ainsi que le flux P2P si un appel est actif.
 * @param {string} deviceId - L'ID du périphérique vidéo à utiliser.
 */
export async function startCamera(deviceId) {
    showTopbarLog(`🎥 Démarrage de la caméra ID: ${deviceId}...`);
    
    try {
        // 1. Arrêter les anciennes pistes du flux local s'il existe
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        // 2. Définir les contraintes: Utiliser la contrainte 'ideal' au lieu de 'exact' 
        // pour plus de tolérance sur mobile.
        const constraints = {
            audio: true, // Toujours inclure l'audio
            video: {
                // Utiliser 'ideal' pour laisser le navigateur choisir la meilleure résolution 
                // tout en ciblant le deviceId
                deviceId: { ideal: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

        // 3. Obtenir le nouveau flux média (Point de défaillance le plus probable)
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        // 4. Mettre à jour le flux local global
        window.localStream = newStream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) { 
            localVideo.srcObject = newStream;
            // Tenter de jouer, mais ne pas faire confiance à la lecture automatique
            localVideo.play().catch(e => {
                // Cette erreur est courante si le navigateur bloque l'autoplay sans interaction
                console.warn("Échec de la lecture automatique de la vidéo locale:", e);
                // On considère que le flux est quand même attribué
            }); 

            // Re-démarrer la détection de visage sur le nouveau flux
            if (typeof initFaceDetection === 'function') {
                initFaceDetection(localVideo);
            }
        }

        // 5. Remplacer les pistes dans la connexion P2P active
        if (window.currentCall && window.currentCall.peerConnection) {
            const sender = window.currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (newVideoTrack) {
                    sender.replaceTrack(newVideoTrack)
                        .then(() => showTopbarLog("✅ Flux P2P mis à jour."))
                        .catch(err => console.error("Échec de remplacement de piste P2P:", err));
                }
            } else {
                 showTopbarLog("⚠ Appel actif, mais pas de sender vidéo trouvé pour la mise à jour.");
            }
        }
        
        showTopbarLog(`✅ Caméra changée avec succès vers ${deviceId}.`);

    } catch (err) {
        // --- GESTION AMÉLIORÉE DE L'ERREUR (Si elle n'a pas de nom standard) ---
        console.error(`Erreur critique lors du démarrage/changement de caméra vers ${deviceId}:`, err);
        
        let errorMsg = "Erreur inconnue (Vérifiez Console & Permissions !)";
        if (err.name) {
            errorMsg = `${err.name}: ${err.message || 'Problème de périphérique ou de permission.'}`;
        } else if (err.toString() !== 'Error: Error') {
            errorMsg = err.toString();
        }
        
        showTopbarLog(`❌ ÉCHEC DÉMARRAGE CAMÉRA: ${errorMsg}`, "#c0392b");
    }
}
