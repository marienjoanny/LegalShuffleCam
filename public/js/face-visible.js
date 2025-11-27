// LegalShuffleCam • face-visible.js (Module ES)
// Intégration de tracking.js pour la détection faciale locale et mise à jour de l'interface.

let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let options = {};

// Référence au conteneur (nous appliquons la bordure au conteneur pour plus de visibilité)
const container = document.getElementById('localVideoContainer'); 

// Global pour synchroniser avec d'autres modules (match.js, app-lite.js)
window.faceVisible = false;

// ----------------------------------------------------------------------
// Fonctions de Mise à Jour de l'UI
// ----------------------------------------------------------------------

/**
 * Applique le style de bordure au conteneur vidéo local en fonction de l'état.
 * @param {boolean} isVisible - True si un visage est détecté.
 */
function updateBorder(isVisible) {
    if (!container) return;

    // Si le consentement mutuel est donné (géré par app-lite.js/match.js), la bordure est bleue/neutre.
    if (window.mutualConsentGiven) {
        container.style.border = '4px solid #3498db'; /* Bleu neutre */
        container.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
        return;
    }

    // Mode anti-enregistrement ACTIF (Bordure dynamique)
    if (isVisible) {
        // Visage visible = OK (Vert)
        container.style.border = '4px solid #2ecc71'; /* Vert */
        container.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8)';
    } else {
        // Visage masqué = DANGER/ATTENTION (Rouge)
        container.style.border = '4px solid #e74c3c'; /* Rouge */
        container.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.8)';
    }
}

/**
 * Déclenche un événement global pour que d'autres modules (ex: match.js) puissent réagir.
 * @param {boolean} isVisible - État de visibilité actuel.
 * @param {boolean} isStopped - Indique si le tracking est arrêté.
 */
function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));
}


// ----------------------------------------------------------------------
// Logique de Détection
// ----------------------------------------------------------------------

/**
 * Initialise et lance la détection faciale sur l'élément vidéo donné.
 * @param {HTMLVideoElement} video - L'élément vidéo à tracker.
 * @param {object} customOptions - Options de configuration (ex: detectionTimeout).
 */
export function initFaceDetection(video, customOptions = {}) {
    if (!container) {
         console.error("Erreur Face Detection: Le conteneur #localVideoContainer est introuvable.");
         return;
    }
    
    // Si un tracker est déjà actif, l'arrêter d'abord.
    stopFaceDetection(); 

    videoElement = video;
    options = {
        detectionTimeout: 1000, // Défaut : 1 seconde
        ...customOptions
    };

    // 1. Initialisation du Tracker
    // Utiliser la fonction globale 'tracking' fournie par tracking.js
    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);
    
    // 2. Écoute des Résultats de la Détection
    tracker.on('track', function(event) {
        if (event.data.length > 0) {
            // Un visage est détecté
            lastDetectionTime = Date.now();
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder(true);
                dispatchVisibilityEvent(true);
            }
        }
    });

    // 3. Lancement du Tracker
    window.tracking.track(videoElement, tracker, { camera: true }); 
    
    // 4. Intervalle de Vérification pour "Visage Perdu" (Le tracker ne signale pas l'absence)
    detectionIntervalId = setInterval(() => {
        // Si le consentement mutuel est actif, on ne vérifie pas et on garde la bordure bleue
        if (window.mutualConsentGiven) {
            updateBorder(false); // Force le bleu/neutre
            return;
        }

        const timeSinceLastDetection = Date.now() - lastDetectionTime;
        
        if (timeSinceLastDetection > options.detectionTimeout) {
            // Pas de détection récente (visage perdu)
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder(false);
                dispatchVisibilityEvent(false);
            }
        }
    }, 200); // Vérifie toutes les 200ms

    // Force une première mise à jour (bordure rouge/verte selon l'état initial)
    updateBorder(window.faceVisible); 
    dispatchVisibilityEvent(window.faceVisible);
}

/**
 * Arrête le tracker et réinitialise l'état.
 */
export function stopFaceDetection() {
    if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
        detectionIntervalId = null;
    }
    
    if (tracker && videoElement) {
        // tracking.js n'a pas de méthode stop officielle simple,
        // mais le fait d'arrêter la caméra et de ne pas relancer le tracking suffit.
        // On retire l'écoute d'événements si possible.
        // On arrête aussi les pistes de la caméra dans camera.js, ce qui arrête le tracking.
        tracker = null;
    }

    window.faceVisible = false;
    lastDetectionTime = 0;
    videoElement = null;

    // Nettoyer l'UI : Bordure bleue neutre pour indiquer que le service est éteint
    if (container) {
        container.style.border = '4px solid #95a5a6'; /* Gris neutre/éteint */
        container.style.boxShadow = 'none';
    }

    // Signaler que le tracking est arrêté
    dispatchVisibilityEvent(false, true); 
}