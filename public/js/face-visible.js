// js/face-visible.js - Logique de détection faciale modulaire pour validation
// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null;
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};
let attempts = 0;
const MAX_ATTEMPTS = 50;

// Utilise une fonction de log ou une fonction par défaut (pour l'utiliser hors index-real.php)
const showTopbarLog = window.showTopbar || ((msg, color) => {
    const topBar = document.getElementById("topBar");
    if (topBar) {
        topBar.textContent = msg;
        if (color) topBar.style.color = color;
    }
});

if (typeof window.mutualConsentGiven === 'undefined') {
    window.mutualConsentGiven = false;
}
window.faceVisible = false;

// ----------------------------
//       BORDURE
// ----------------------------
function updateBorder(color) {
    if (!videoElement) return;
    videoElement.style.border = `4px solid ${color}`;
    videoElement.style.boxShadow = `0 0 10px ${color}`;
}

// ----------------------------
//    EVENT FACE VISIBILITY
// ----------------------------
function dispatchVisibilityEvent(isVisible) {
    // Dispatch un événement pour que d'autres modules (comme Match.js) puissent écouter
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible }
    }));

    // Gère la mise à jour de la barre de statut (TopBar)
    if (!window.mutualConsentGiven) {
        const message = isVisible
            ? "✅  Visage détecté (≥30%). Bouton Suivant actif."
            : "❌  Visage perdu/trop petit (<30%). Bouton Suivant désactivé.";
        showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
    } else if (window.mutualConsentGiven === true) {
        // Le consentement est donné, on affiche le statut Bleu
        showTopbarLog("Consentement mutuel donné. Visage non masqué.", "#3498db");
    }
}

// ----------------------------
//      LOGIQUE DE TRACKING
// ----------------------------
function startTrackingInternal() {
    // 1. Initialisation du Tracker
    tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    // 2. Événement de détection
    tracker.on('track', event => {
        const now = Date.now();
        const videoArea = videoElement.videoWidth * videoElement.videoHeight;
        let faceFound = false;

        if (event.data.length > 0) {
            event.data.forEach(rect => {
                const faceArea = rect.width * rect.height;
                const ratio = faceArea / videoArea;
                if (ratio >= customOptions.minFaceRatio) {
                    lastDetectionTime = now; // Mise à jour du temps
                    faceFound = true;
                }
            });
        }
    });

    // 3. Démarrage du Tracker
    trackerTask = window.tracking.track('#localVideo', tracker); // Assumant l'ID 'localVideo'

    // Initialiser l'état
    lastDetectionTime = Date.now();
    window.faceVisible = true;
    updateBorder("#2ecc71");
    dispatchVisibilityEvent(true);
    showTopbarLog("Détection faciale active...", "#2ecc71");


    // 4. Intervalle de vérification de l'état (le cœur de la robustesse)
    detectionIntervalId = setInterval(() => {
        const now = Date.now();
        const diff = now - lastDetectionTime;

        // --- GESTION DE L'ÉTAT ---

        // Priorité: Consentement Mutuel (état permanent)
        if (window.mutualConsentGiven === true) {
            updateBorder("#3498db");
            if (!window.faceVisible) {
                window.faceVisible = true;
                dispatchVisibilityEvent(true);
            }
            return;
        }

        // Vérification de la détection faciale (si consentement non donné)
        if (diff > customOptions.detectionTimeout) {
            // Le visage est perdu (délai dépassé)
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder("#e74c3c");
                dispatchVisibilityEvent(false);
            }
        } else {
            // Le visage est encore visible
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder("#2ecc71");
                dispatchVisibilityEvent(true);
            }
        }
    }, 200); // Vérification toutes les 200ms
}


// ----------------------------
//     FIX DE LA RACE CONDITION
// ----------------------------
function checkTrackingReadyAndStart() {
    if (typeof window.tracking !== 'undefined' && typeof window.tracking.ObjectTracker !== 'undefined') {
        startTrackingInternal();
    } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(checkTrackingReadyAndStart, 100);
    } else {
        showTopbarLog("❌  Échec de la détection faciale (Tracking.js non chargé)", "#e74c3c");
        updateBorder("#e74c3c");
        // Optionnel: Désactiver ici le bouton Suivant si le tracking échoue
    }
}

// ----------------------------
//       INIT PUBLIC
// ----------------------------
/**
 * Initialise le tracking facial sur l'élément vidéo donné.
 * @param {HTMLVideoElement} video - L'élément vidéo à suivre.
 * @param {object} options - Options de configuration.
 */
export function initFaceDetection(video, options = {}) {
    stopFaceDetection();

    videoElement = video;
    customOptions = {
        detectionTimeout: 2000,   // tolérance
        minFaceRatio: 0.3,        // ratio min
        ...options
    };

    videoElement.style.border = '4px solid #95a5a6';
    videoElement.style.boxShadow = 'none';

    attempts = 0;

    // Démarre la vérification une fois que la vidéo commence à jouer
    videoElement.addEventListener("playing", () => {
        checkTrackingReadyAndStart();
    }, { once: true });
}

// ----------------------------
//        STOP PUBLIC
// ----------------------------
export function stopFaceDetection() {
    if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
        detectionIntervalId = null;
    }

    if (trackerTask) {
        trackerTask.stop();
        trackerTask = null;
    }

    if (tracker) {
        tracker.removeAllListeners();
        tracker = null;
    }
    
    // Ne pas annuler videoElement ici s'il est utilisé par un autre module (Match.js)

    window.faceVisible = false;
    lastDetectionTime = 0;

    dispatchVisibilityEvent(false);
}

// ----------------------------
//  VALIDATION POUR MATCH.JS
// ----------------------------
export function isFaceValidated() {
    // La validation est réussie si le visage est visible OU si le consentement mutuel est donné.
    return window.faceVisible || window.mutualConsentGiven === true;
}
