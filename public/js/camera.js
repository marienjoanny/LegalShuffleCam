// LegalShuffleCam • camera.js (Module ES)
// Gestion de la liste des caméras et du démarrage du flux local.

// LOG: Module /js/camera.js chargé.
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
 * Liste les périphériques vidéo disponibles, peuple le sélecteur, 
 * et déclenche le démarrage de la première caméra (Patch 8).
 */
export async function listCameras() {
    showTopbarLog("🔎 Recherche des caméras disponibles...");
    const select = document.getElementById('cameraSelect');
    if (!select) {
        return;
    }
    
    select.innerHTML = ''; // Nettoyer les options précédentes
    
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        if (videoDevices.length === 0) {
            select.innerHTML = '<option value="">Aucune caméra trouvée</option>';
            select.disabled = true;
            showTopbarLog("❌ Aucune caméra vidéo détectée.");
            return;
        }

        let firstDeviceId = null; 
        
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Caméra ${index + 1}`; 
            select.appendChild(option);
            
            // Sélectionner la première caméra par défaut
            if (index === 0) {
                option.selected = true;
                firstDeviceId = device.deviceId; // Stocker l'ID de la première
            }
        });
        
        select.disabled = false;
        showTopbarLog(`✅ ${videoDevices.length} caméras détectées.`);

        // --- DÉMARRAGE IMMÉDIAT DU FLUX (PATCH 8) ---
        if (firstDeviceId) {
            // Appeler startCamera avec l'ID de la première caméra
            await startCamera(firstDeviceId); 
        }

    } catch (err) {
        console.error("Erreur lors de l'énumération des périphériques:", err);
        select.innerHTML = '<option value="">Erreur de liste</option>';
        select.disabled = true;
        showTopbarLog("❌ Échec de l'énumération des caméras (permission requise).", "#c0392b");
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

        // 2. Définir les contraintes: Utilisation de 'ideal' pour plus de tolérance (Patch 6)
        const constraints = {
            audio: true, 
            video: {
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
            
            // Tenter de jouer, en gérant l'échec d'autoplay sans arrêter le script
            localVideo.play().catch(e => {
                console.warn("Échec de la lecture automatique de la vidéo locale:", e);
            }); 

            // Re-démarrer la détection de visage sur le nouveau flux
            if (typeof initFaceDetection === 'function') {
                initFaceDetection(localVideo);
            }
        }

        // 5. Remplacer les pistes dans la connexion P2P active (logique de match.js)
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
        // --- GESTION AMÉLIORÉE DE L'ERREUR (Patch 5) ---
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
