// LOG: Module /js/camera.js chargé. (Validation obligatoire)
function showTopbarLog(message) {
    if (typeof showTopbar === 'function') {
        showTopbar(message);
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
        // console.warn("L'élément 'cameraSelect' est manquant. Fonctionnalité de sélection ignorée.");
        return;
    }
    
    select.innerHTML = ''; // Nettoyer les options précédentes
    
    try {
        // Obtenir la liste des périphériques
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // Filtrer uniquement les périphériques vidéo
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
            // Utiliser un nom générique si le label est vide (problème de permissions initiales)
            option.textContent = device.label || `Caméra ${index + 1}`; 
            select.appendChild(option);
            
            // Sélectionner la première caméra par défaut
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

        // 2. Obtenir le nouveau flux média
        const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
            audio: true // Toujours inclure l'audio
        });

        // 3. Mettre à jour le flux local global
        window.localStream = newStream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) { 
            localVideo.srcObject = newStream;
            localVideo.play();
            // Re-démarrer la détection de visage sur le nouveau flux si le module existe
            // La fonction est attachée au scope global par face-visible.js
            if (typeof initFaceDetection === 'function') {
                initFaceDetection(localVideo);
            }
        }

        // 4. Remplacer les pistes dans la connexion P2P active
        // window.currentCall est défini dans match.js
        if (window.currentCall && window.currentCall.peerConnection) {
            const sender = window.currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender) {
                // Remplacer la piste vidéo avec la nouvelle piste du nouveau flux
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
        console.error(`Erreur lors du changement de caméra vers ${deviceId}:`, err);
        showTopbarLog("❌ Échec de la sélection de caméra. (Permissions ?)");
    }
}