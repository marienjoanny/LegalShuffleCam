// LegalShuffleCam • face-visible.js (Module ES)
// Détection faciale avec tracking.js et gestion des événements personnalisés.

// Variable pour maintenir la référence au tracker en cours
let currentTracker = null;
let lastDetectionTimer = null;
let lastDetectionTime = 0;
let videoElement = null;

// Rendre la variable globale pour que l'UI puisse y réagir si nécessaire
window.faceVisible = false;

/**
 * Fonction utilitaire pour envoyer un log à la barre d'état.
 */
function showTopbarLog(message, color = '#2980b9') {
    if (typeof showTopbar === 'function') {
        showTopbar(`[FACE] ${message}`, color);
    } else {
        console.log(`[FACE] ${message}`);
    }
}

/**
 * Arrête la détection faciale en cours.
 */
export function stopFaceDetection() {
    if (currentTracker && videoElement) {
        currentTracker.removeAllListeners('track');
        // Tentative d'arrêt du tracking sur l'élément vidéo
        if (typeof tracking.stopTracking === 'function') {
             tracking.stopTracking(videoElement);
        } else {
            console.warn("[FACE] tracking.stopTracking() non disponible. Le tracker pourrait rester actif.");
        }
        
        currentTracker = null;
        videoElement = null;
        window.faceVisible = false;
        
        if (lastDetectionTimer) {
            clearTimeout(lastDetectionTimer);
            lastDetectionTimer = null;
        }

        // Mettre à jour l'UI pour indiquer l'arrêt
        window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
            detail: { isVisible: false }
        }));

        showTopbarLog("Détection faciale arrêtée.", "#f39c12");
    }
}


/**
 * Démarre la détection faciale sur un flux vidéo.
 * @param {HTMLVideoElement} video - Élément vidéo source pour la détection.
 * @param {Object} [options] - Options de configuration.
 */
export function initFaceDetection(video, options = {}) {
    if (!window.tracking || !video) {
        showTopbarLog("tracking.js non chargé ou vidéo invalide. Détection impossible.", "#c0392b");
        window.faceVisible = false;
        return;
    }
    
    // Si un tracker est déjà actif, l'arrêter d'abord
    stopFaceDetection(); 

    const {
        detectionTimeout = 1500,
        initialScale = 4,
        stepSize = 2,
        edgesDensity = 0.1
    } = options;

    const tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(initialScale);
    tracker.setStepSize(stepSize);
    tracker.setEdgesDensity(edgesDensity);

    currentTracker = tracker;
    videoElement = video;
    
    lastDetectionTime = Date.now();
    
    // Fonction pour gérer le changement d'état de visibilité après timeout
    const checkVisibility = () => {
        const now = Date.now();
        const isVisible = (now - lastDetectionTime) < detectionTimeout;
        
        if (isVisible !== window.faceVisible) {
            window.faceVisible = isVisible;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: window.faceVisible }
            }));
            // showTopbarLog sera appelé par l'écouteur d'événement pour éviter la redondance
        }
        
        // Relancer la vérification si le tracker est toujours actif
        if (currentTracker) {
            lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout / 2);
        }
    };
    
    tracker.on('track', (event) => {
        const detected = event.data.length > 0;
        
        if (detected) {
            lastDetectionTime = Date.now();
        }

        // Mise à jour immédiate si l'état change
        if (window.faceVisible !== detected) {
            window.faceVisible = detected;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: detected, data: event.data }
            }));
        }

        // Gestion de la timeout : si le visage n'est plus visible, on lance/continue le timer
        if (!detected && !lastDetectionTimer) {
             lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout);
        } else if (detected && lastDetectionTimer) {
             // Si détecté à nouveau, on réinitialise le timer de la timeout
             clearTimeout(lastDetectionTimer);
             lastDetectionTimer = null;
        }
    });

    tracker.on('error', (error) => {
        console.error("[FACE] Erreur de détection faciale :", error);
        stopFaceDetection();
        showTopbarLog("Erreur de détection faciale critique.", "#c0392b");
    });
    
    // Démarre le tracking sur l'élément vidéo
    tracking.track(video, tracker);
    showTopbarLog("Détection faciale démarrée.");
}


// --- GESTION DES ÉVÉNEMENTS GLOBALES (pour l'UI) ---

document.addEventListener('DOMContentLoaded', () => {
    // Événement pour mettre à jour le style du conteneur vidéo local et la topbar
    window.addEventListener('faceVisibilityChanged', (event) => {
        const localVideoContainer = document.getElementById('localVideoContainer');
        const isVisible = event.detail.isVisible;
        
        if (localVideoContainer) {
            // Ajout du cadre vert/rouge sur la vidéo locale
            localVideoContainer.style.border = isVisible
                ? "3px solid #10b981" // Vert (visage détecté)
                : "3px solid #ef4444"; // Rouge (visage perdu/flou)
            localVideoContainer.style.transition = "border 0.3s ease";
        }
        
        // Mise à jour de la bannière d'avertissement rouge
        const warningIpSpan = document.querySelector('.warning-ip span');
        if (warningIpSpan) {
             warningIpSpan.innerHTML = isVisible
                ? '⚠️ VISAGE VISIBLE ! Votre IP est loguée ! Navigation Privée OBLIGATOIRE ! L\'enregistrement est illégal !!'
                : '✅ Visage masqué/perdu. Votre IP est loguée. (L\'enregistrement est illégal !)';
            warningIpSpan.style.color = isVisible ? 'red' : '#2ecc71';
        }
        
        // Mise à jour de la TopBar
        showTopbarLog(`Visage ${isVisible ? 'détecté (Cadre vert)' : 'perdu (Cadre rouge)'}.`, isVisible ? '#2ecc71' : '#e74c3c');
    });
});