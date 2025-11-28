// /public/js/face-visible.js
// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null;
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};

// FIX RACING CONDITION: Variables de gestion du polling
let attempts = 0;
const MAX_ATTEMPTS = 50; // Max 5 secondes d'attente @ 100ms

// Conteneur pour la bordure
const container = document.getElementById('localVideoContainer');

// Référence vers la fonction showTopbar
const showTopbarLog = window.showTopbar || ((msg, color) => {
    const topBar = document.getElementById("topBar");
    if (topBar) topBar.textContent = msg;
});

// État global
window.faceVisible = false;


// ----------------------------
//       BORDURE
// ----------------------------
function updateBorder(isVisible) {
    if (!container) return;

    if (window.mutualConsentGiven) {
        // Bordure bleue/neutre si le consentement mutuel est donné
        container.style.border = '4px solid #3498db';
        container.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
        return;
    }

    if (isVisible) {
        // Bordure verte si le visage est détecté (et pas de consentement)
        container.style.border = '4px solid #2ecc71';
        container.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8)';
    } else {
        // Bordure rouge si le visage est perdu (et pas de consentement)
        container.style.border = '4px solid #e74c3c';
        container.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.8)';
    }
}


// ----------------------------
//    EVENT FACE VISIBILITY
// ----------------------------
function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));

    const warningIp = document.querySelector('.warning-ip');
    if (warningIp) {
        // Mise en évidence du warning si le visage est visible et pas de consentement mutuel
        const highlight = isVisible && !window.mutualConsentGiven;
        warningIp.style.backgroundColor = highlight ? 'rgba(255, 0, 0, 0.7)' : 'transparent';
        warningIp.style.transition = 'background-color 0.5s';
        warningIp.style.borderRadius = '5px';
    }

    if (!window.mutualConsentGiven && !isStopped) {
        const message = isVisible
            ? "Visage détecté et au centre. Le bouton Suivant est actif."
            : "Visage perdu/trop petit. Le bouton Suivant est désactivé.";
        showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
    } else if (window.mutualConsentGiven && !isStopped) {
         showTopbarLog("Consentement mutuel donné. Visage non masqué.", "#3498db");
    }
}


// ----------------------------
//     TRACKING PRINCIPAL
// ----------------------------
function startTrackingInternal() {
    // Si la tâche est déjà lancée, ou si tracking.js n'est pas là, on s'arrête
    if (trackerTask || !videoElement || typeof window.tracking === 'undefined') return;

    // Tracker
    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0);
    tracker.setEdgesDensity(0.1);
    tracker.setSkip(10); // Ne pas traiter chaque frame pour des raisons de performance

    showTopbarLog("🟢 Détection faciale activée (ratio min: " + (customOptions.minFaceRatio * 100) + "%)");

    tracker.on('track', event => {

        // Si le consentement mutuel est donné, on ignore les résultats du tracking
        if (window.mutualConsentGiven) return;

        const vw = videoElement.videoWidth || videoElement.clientWidth;
        const vh = videoElement.videoHeight || videoElement.clientHeight;

        if (!vw || !vh) return;

        let validFaceFound = false;

        event.data.forEach(rect => {
            const faceArea = rect.width * rect.height;
            const videoArea = vw * vh;
            const ratio = faceArea / videoArea;

            // Critère de validation: taille suffisante du visage
            if (ratio >= customOptions.minFaceRatio) {
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
    });

    trackerTask = window.tracking.track(videoElement, tracker);

    showTopbarLog("📡 Tâche de tracking lancée.", "#f1c40f");

    // Initialisation: On considère le visage visible au démarrage (on se base sur le timeout ensuite)
    lastDetectionTime = Date.now();
    window.faceVisible = true;
    updateBorder(true);
    dispatchVisibilityEvent(true);

    // Vérification périodique (le "polling" pour vérifier si le visage est perdu)
    detectionIntervalId = setInterval(() => {

        if (window.mutualConsentGiven) {
            updateBorder(true);
            if (!window.faceVisible) {
                window.faceVisible = true;
                dispatchVisibilityEvent(true);
            }
            return;
        }

        const diff = Date.now() - lastDetectionTime;

        if (diff > customOptions.detectionTimeout) {
            // Visage perdu (timeout dépassé)
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder(false);
                dispatchVisibilityEvent(false);
            }
        } else {
            // Visage toujours frais (récemment détecté)
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder(true);
                dispatchVisibilityEvent(true);
            }
        }

    }, 200); // Vérification toutes les 200ms
}


// ----------------------------
//     FIX DE LA RACE CONDITION
// ----------------------------
/**
 * Vérifie si Tracking.js est prêt et lance le tracking si c'est le cas.
 */
function checkTrackingReadyAndStart() {
    if (typeof window.tracking !== 'undefined' && typeof window.tracking.ObjectTracker !== 'undefined') {
        // Succès : La librairie est chargée
        startTrackingInternal();
    } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        // Échec temporaire : On essaie de nouveau dans 100ms
        setTimeout(checkTrackingReadyAndStart, 100); 
    } else {
        // Échec critique : Tracking.js n'a pas chargé après 5 secondes
        showTopbarLog("❌ Échec de la détection faciale (Tracking.js non chargé après 5s).", "#e74c3c");
        console.error("Échec du chargement de tracking.js après plusieurs tentatives. La détection est désactivée.");
        // Nettoyage et mise en état neutre
        stopFaceDetection();
        updateBorder(false);
    }
}


// ----------------------------
//       INIT PUBLIC
// ----------------------------
export function initFaceDetection(video, options = {}) {
    if (!container) {
        showTopbarLog("❌ Erreur Face Detection: #localVideoContainer introuvable", "#e74c3c");
        return;
    }

    stopFaceDetection();

    videoElement = video;
    customOptions = {
        detectionTimeout: 3000,
        minFaceRatio: 0.05, // 5% du cadre → réaliste
        ...options
    };

    container.style.border = '4px solid #95a5a6'; // Bordure neutre initiale
    container.style.boxShadow = 'none';
    
    // Réinitialiser le compteur de tentatives pour le polling
    attempts = 0;

    // Si la vidéo n'a pas encore chargé ses dimensions
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        videoElement.addEventListener("loadeddata", () => {
            // Lancer le polling après le chargement des données vidéo
            checkTrackingReadyAndStart();
        }, { once: true });
        return;
    }

    // Si les dimensions sont prêtes, lancer le polling immédiatement
    checkTrackingReadyAndStart();
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
        // tracking.js n'expose pas de méthode pour 'untrack', on doit arrêter la tâche
        trackerTask.stop();
        trackerTask = null;
    }

    if (tracker) {
        // Suppression des écouteurs
        tracker.removeAllListeners();
        tracker = null;
    }

    videoElement = null;

    window.faceVisible = false;
    lastDetectionTime = 0;

    if (container) {
        // Bordure grise/neutre à l'arrêt
        container.style.border = '4px solid #95a5a6';
        container.style.boxShadow = 'none';
    }

    dispatchVisibilityEvent(false, true);
    showTopbarLog("🔴 Détection faciale arrêtée");
}


// ----------------------------
//  VALIDATION POUR MATCH.JS
// ----------------------------
export function isFaceValidated() {
    // La validation est OK si le visage est visible OU si le consentement mutuel est donné
    return window.faceVisible || window.mutualConsentGiven;
}