// LegalShuffleCam • camera.js (Module ES)
// Gestion de la liste des caméras et du démarrage du flux local.

import { initFaceDetection, stopFaceDetection } from "/js/face-visible.js"; 

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

export async function listCameras() {
    showTopbarLog("🔎 Recherche des caméras disponibles...");
    const select = document.getElementById('cameraSelect');
    if (!select) return;
    
    select.innerHTML = '';
    
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
            
            if (index === 0) {
                option.selected = true;
                firstDeviceId = device.deviceId;
            }
        });
        
        select.disabled = false;
        showTopbarLog(`✅ ${videoDevices.length} caméras détectées.`);

        if (firstDeviceId) {
            await startCamera(firstDeviceId); 
        }

    } catch (err) {
        console.error("Erreur lors de l'énumération des périphériques:", err);
        select.innerHTML = '<option value="">Erreur de liste</option>';
        select.disabled = true;
        showTopbarLog("❌ Échec de l'énumération des caméras (permission requise).", "#c0392b");
    }
}

export async function startCamera(deviceId) {
    showTopbarLog(`🎥 Démarrage de la caméra ID: ${deviceId}...`);
    
    try {
        if (window.localStream) {
            stopFaceDetection(); 
            window.localStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            audio: true, 
            video: {
                deviceId: { ideal: deviceId },
                width: { ideal: 1280, min: 640 },
                height: { ideal: 720, min: 480 }
            }
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);

        window.localStream = newStream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) { 
            localVideo.srcObject = newStream;
            localVideo.play().catch(e => {
                console.warn("Échec de la lecture automatique de la vidéo locale:", e);
            }); 

            // ✅ Timeout ajusté à 3000 ms pour plus de stabilité
            initFaceDetection(localVideo, { 
                detectionTimeout: 3000 
            });
        }
        
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
        
        showTopbarLog(`✅ Caméra changée avec succès vers ${deviceId}. Détection faciale lancée.`);

    } catch (err) {
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

export function stopCamera() {
    if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
        window.localStream = null;
        
        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
             localVideo.srcObject = null;
        }

        stopFaceDetection();
        
        showTopbarLog("Caméra et détection faciale arrêtées.", "#3498db");
    }
}

export function getLocalStream() {
    return window.localStream;
}