// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null;
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};
let consentTriggeredStop = false;

const container = document.getElementById('localVideoContainer');
const showTopbarLog = window.showTopbar || ((msg, color) => {
    const topBar = document.getElementById("topBar");
    if (topBar) topBar.textContent = msg;
});

if (typeof window.mutualConsentGiven === 'undefined') {
    window.mutualConsentGiven = false;
}
window.faceVisible = false;

// ----------------------------
//       BORDURE
// ----------------------------
function updateBorder(isVisible) {
    if (!container) return;

    if (window.mutualConsentGiven === true && consentTriggeredStop) {
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
        const highlight = isVisible && !window.mutualConsentGiven;
        warningIp.style.backgroundColor = highlight ? 'rgba(255, 0, 0, 0.7)' : 'transparent';
        warningIp.style.transition = 'background-color 0.5s';
        warningIp.style.borderRadius = '5px';
    }

    if (!window.mutualConsentGiven && !isStopped) {
        const message = isVisible
            ? "✅ Visage détecté et au centre. Bouton Suivant actif."
            : "⚠ Visage perdu/trop petit. Bouton Suivant désactivé.";
        showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
    } else if (window.mutualConsentGiven === true && !isStopped) {
        showTopbarLog("Consentement mutuel donné. Visage non masqué.", "#3498db");
    } else if (isStopped) {
        showTopbarLog("🔴 Détection faciale arrêtée (non consentement)", "#e74c3c");
    }
}

// ----------------------------
//     TRACKING PRINCIPAL
// ----------------------------
function startTrackingInternal() {
    if (trackerTask || !videoElement || typeof window.tracking === 'undefined') return;

    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0);
    tracker.setEdgesDensity(0.1);
    tracker.setSkip(10);

    showTopbarLog("🟢 Détection faciale activée (ratio min: " + (customOptions.minFaceRatio * 100) + "%)");

    tracker.on('track', event => {
        const vw = videoElement.videoWidth || videoElement.clientWidth;
        const vh = videoElement.videoHeight || videoElement.clientHeight;
        if (!vw || !vh) return;

        let validFaceFound = false;

        event.data.forEach(rect => {
            const faceArea = rect.width * rect.height;
            const videoArea = vw * vh;
            const ratio = faceArea / videoArea;
            if (ratio >= customOptions.minFaceRatio) validFaceFound = true;
        });

        // Si consentement mutuel ET visage détecté → arrêt
        if (window.mutualConsentGiven === true && validFaceFound) {
            consentTriggeredStop = true;
            stopFaceDetection();
            updateBorder(true);
            dispatchVisibilityEvent(true, true);
            return;
        }

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

    lastDetectionTime = Date.now();
    window.faceVisible = true;
    updateBorder(true);
    dispatchVisibilityEvent(true);

    detectionIntervalId = setInterval(() => {
        if (window.mutualConsentGiven === true && consentTriggeredStop) {
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
//     FIX DE LA RACE CONDITION
// ----------------------------
function checkTrackingReadyAndStart() {
    if (typeof window.tracking !== 'undefined' && typeof window.tracking.ObjectTracker !== 'undefined') {
        startTrackingInternal();
    } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        setTimeout(checkTrackingReadyAndStart, 100); 
    } else {
        showTopbarLog("❌ Échec de la détection faciale (Tracking.js non chargé après 5s).", "#e74c3c");
        console.error("Échec du chargement de tracking.js après plusieurs tentatives.");
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
        minFaceRatio: 0.05,
        ...options
    };

    container.style.border = '4px solid #95a5a6';
    container.style.boxShadow = 'none';
    
    attempts = 0;
    consentTriggeredStop = false;

    if (!videoElement.videoWidth || !videoElement.videoHeight) {
        // ⚡ Patch : attendre playing au lieu de loadeddata
        videoElement.addEventListener("playing", () => {
            checkTrackingReadyAndStart();
        }, { once: true });
        return;
    }

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
        trackerTask.stop();
        trackerTask = null;
    }

    if (tracker) {
        tracker.removeAllListeners();
        tracker = null;
    }

    videoElement = null;
    window.faceVisible = false;
    lastDetectionTime = 0;

    if (container) {
        container.style.border = '4px solid #95a5a6';
        container.style.boxShadow = 'none';
    }

    dispatchVisibilityEvent(false, true);
}

// ----------------------------
//  VALIDATION POUR MATCH.JS
// ----------------------------
export function isFaceValidated() {
    return window.faceVisible || window.mutualConsentGiven === true;
}