// /public/js/face-visible.js
// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null;
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};

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
        container.style.border = '4px solid #3498db';
        container.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
        return;
    }

    if (isVisible) {
        container.style.border = '4px solid #2ecc71';
        container.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8)';
    } else {
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
        warningIp.style.backgroundColor = isVisible ? 'rgba(255, 0, 0, 0.7)' : 'transparent';
        warningIp.style.transition = 'background-color 0.5s';
        warningIp.style.borderRadius = '5px';
    }

    if (!window.mutualConsentGiven && !isStopped) {
        const message = isVisible
            ? "Visage détecté et au centre. Le bouton Suivant est actif."
            : "Visage perdu/trop petit. Le bouton Suivant est désactivé.";
        showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
    }
}


// ----------------------------
//     TRACKING PRINCIPAL
// ----------------------------
function startTrackingInternal() {
    if (trackerTask || !videoElement) return;

    // Vérifier que les dimensions vidéo sont prêtes
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        showTopbarLog("⏳ Dimensions vidéo pas prêtes. Attente…", "#f39c12");
        setTimeout(startTrackingInternal, 150);
        return;
    }

    // Tracker
    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0);
    tracker.setEdgesDensity(0.1);
    tracker.setSkip(10);

    showTopbarLog("🟢 Détection faciale activée (ratio min: " + (customOptions.minFaceRatio * 100) + "%)");

    tracker.on('track', event => {

        if (window.mutualConsentGiven) return;

        const vw = videoElement.videoWidth || videoElement.clientWidth;
        const vh = videoElement.videoHeight || videoElement.clientHeight;

        if (!vw || !vh) return;

        let validFaceFound = false;

        event.data.forEach(rect => {
            const faceArea = rect.width * rect.height;
            const videoArea = vw * vh;
            const ratio = faceArea / videoArea;

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

    lastDetectionTime = Date.now();
    window.faceVisible = true;
    updateBorder(true);
    dispatchVisibilityEvent(true);

    // Vérification périodique
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
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder(false);
                dispatchVisibilityEvent(false);
            }
        } else {
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder(true);
                dispatchVisibilityEvent(true);
            }
        }

    }, 200);
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

    container.style.border = '4px solid #95a5a6';
    container.style.boxShadow = 'none';

    // Si la vidéo n'a pas encore chargé ses dimensions
    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        videoElement.addEventListener("loadeddata", () => {
            setTimeout(startTrackingInternal, 100);
        }, { once: true });
        return;
    }

    setTimeout(startTrackingInternal, 100);
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

    tracker = null;
    videoElement = null;

    window.faceVisible = false;
    lastDetectionTime = 0;

    if (container) {
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
    return window.faceVisible || window.mutualConsentGiven;
}