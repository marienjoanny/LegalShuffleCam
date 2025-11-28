// /public/js/face-visible.js
// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null; // Tâche de tracking retournée par tracking.track()
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};

// Référence vers le conteneur pour la bordure
const container = document.getElementById('localVideoContainer'); 

// Récupération de la fonction globale showTopbar
const showTopbarLog = window.showTopbar || ((msg, color) => {
    const topBar = document.getElementById("topBar");
    if (topBar) topBar.textContent = msg;
});

// État de visibilité global, utilisé par match.js
window.faceVisible = false;

function updateBorder(isVisible) {
    if (!container) return;

    // Consentement mutuel (mode spécial)
    if (window.mutualConsentGiven) {
        container.style.border = '4px solid #3498db'; 
        container.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
        return;
    }

    // Modération standard
    if (isVisible) {
        container.style.border = '4px solid #2ecc71'; 
        container.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8)';
    } else {
        container.style.border = '4px solid #e74c3c'; 
        container.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.8)';
    }
}

function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));
    
    // Mise à jour de la barre d'avertissement IP/Log
    const warningIp = document.querySelector('.warning-ip');
    if (warningIp) {
        warningIp.style.backgroundColor = isVisible ? 'rgba(255, 0, 0, 0.7)' : 'transparent';
        warningIp.style.transition = 'background-color 0.5s';
        warningIp.style.borderRadius = '5px';
    }
    
    // Affichage dans la TopBar si pas de consentement
    if (!window.mutualConsentGiven && !isStopped) {
        const message = isVisible 
            ? "Visage détecté et au centre. Le bouton Suivant est actif." 
            : "Visage perdu/trop petit. Le bouton Suivant est désactivé.";
        showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
    }
}

/**
 * Logique principale de démarrage du tracking.
 */
function startTrackingInternal() {
    if (trackerTask || !videoElement) return;

    // Création du tracker
    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0);
    tracker.setEdgesDensity(0.1);
    tracker.setSkip(10); // Pour ne pas surcharger le processeur

    showTopbarLog("🟢 Détection faciale activée (ratio minimum requis: 30%)");

    tracker.on('track', function(event) {
        if (window.mutualConsentGiven) return;

        const videoWidth = videoElement.clientWidth;
        const videoHeight = videoElement.clientHeight;
        const videoArea = videoWidth * videoHeight;

        if (videoArea === 0) return;

        if (event.data.length > 0) {
            let validFaceFound = false;

            event.data.forEach(rect => {
                const faceArea = rect.width * rect.height;
                const ratio = faceArea / videoArea;
                
                // Vérification du critère de taille : 30% de la surface vidéo
                if (ratio >= 0.3) {
                    validFaceFound = true;
                }
            });

            if (validFaceFound) {
                lastDetectionTime = Date.now();
                if (!window.faceVisible) {
                    window.faceVisible = true;
                    updateBorder(true);
                    dispatchVisibilityEvent(true);
                }
            }
        }
    });

    // Lancement de la tâche de tracking et stockage de la référence
    trackerTask = window.tracking.track(videoElement, tracker); 
    showTopbarLog("📡 Tâche de tracking lancée sur le flux vidéo.", "#f1c40f");

    lastDetectionTime = Date.now();
    window.faceVisible = true; // Par défaut, on assume la visibilité au lancement

    // Intervalle pour vérifier l'expiration (visage perdu ou trop petit)
    detectionIntervalId = setInterval(() => {
        if (window.mutualConsentGiven) {
            updateBorder(true);
            // Assurer que l'état interne reste visible en cas de consentement
            if (!window.faceVisible) {
                 window.faceVisible = true;
                 dispatchVisibilityEvent(true);
            }
            return;
        }

        const timeSinceLastDetection = Date.now() - lastDetectionTime;

        if (timeSinceLastDetection > customOptions.detectionTimeout) {
            // Visage perdu : Timeout atteint
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder(false);
                dispatchVisibilityEvent(false);
            }
        } else {
             // Visage OK : Détection récente
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder(true);
                dispatchVisibilityEvent(true);
            }
        }
    }, 200);

    updateBorder(window.faceVisible); 
    dispatchVisibilityEvent(window.faceVisible);
}


/**
 * Fonction publique pour initialiser la détection.
 */
export function initFaceDetection(video, options = {}) {
    if (!container) {
        showTopbarLog("❌ Erreur Face Detection: #localVideoContainer introuvable", "#e74c3c");
        return;
    }
    
    stopFaceDetection();

    videoElement = video;
    customOptions = {
        detectionTimeout: 3000, // 3 secondes par défaut pour déclarer la perte
        ...options
    };

    container.style.border = '4px solid #95a5a6';
    container.style.boxShadow = 'none';
    
    // Attendre l'événement 'playing' est géré par app-lite.js,
    // donc nous lançons startTrackingInternal directement si la vidéo est prête,
    // ou nous attendons que app-lite.js appelle cette fonction après 'playing'.
    
    // Utiliser un petit délai pour être sûr que les dimensions sont lues
    setTimeout(() => {
        if (videoElement.readyState >= 3) { // READY_STATE_HAVE_FUTURE_DATA
            startTrackingInternal();
        } else {
            showTopbarLog("⏳ Vidéo pas encore prête pour le tracking.", "#f39c12");
        }
    }, 100);
}

/**
 * Fonction publique pour arrêter la détection.
 */
export function stopFaceDetection() {
    if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
        detectionIntervalId = null;
    }
    
    if (trackerTask) {
        trackerTask.stop(); // Arrêter la tâche de tracking.js
        trackerTask = null;
    }
    
    tracker = null;
    videoElement = null;

    // Réinitialisation de l'état
    window.faceVisible = false;
    lastDetectionTime = 0;

    if (container) {
        container.style.border = '4px solid #95a5a6';
        container.style.boxShadow = 'none';
    }

    dispatchVisibilityEvent(false, true); // Signale que la détection est arrêtée
    showTopbarLog("🔴 Détection faciale arrêtée");
}

/**
 * Fonction publique pour que match.js vérifie l'état.
 */
export function isFaceValidated() {
    // Si le consentement mutuel est donné, c'est toujours valide
    return window.faceVisible || window.mutualConsentGiven;
}