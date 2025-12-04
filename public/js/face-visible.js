// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let trackerTask = null;
let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let customOptions = {};
let consentTriggeredStop = false;

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
function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));

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
    tracker.setStepSize(2);
    tracker.setEdgesDensity(0.1);

    showTopbarLog("🟢 Détection faciale activée (ratio min: " + (customOptions.minFaceRatio * 100) + "%)");

    tracker.on('track', event => {
        const vw = videoElement.videoWidth || videoElement.clientWidth;
        const vh = videoElement.videoHeight || videoElement.clientHeight;
        if (!vw || !vh) return;

        let validFaceFound = false;

        // Nombre de visages détectés
        window.dispatchEvent(new CustomEvent('facesDetected', {
            detail: { count: event.data.length }
        }));

        event.data.forEach(rect => {
            const faceArea = rect.width * rect.height;
            const videoArea = vw * vh;
            const ratio = faceArea / videoArea;

            const ratioSpan = document.getElementById("ratioValue");
            if (ratioSpan) ratioSpan.textContent = (ratio * 100).toFixed(1) + "%";

            if (ratio >= customOptions.minFaceRatio) validFaceFound = true;
        });

        if (window.mutualConsentGiven === true && validFaceFound) {
            consentTriggeredStop = true;
            stopFaceDetection();
            updateBorder("#3498db");
            dispatchVisibilityEvent(true, true);
            return;
        }

        if (validFaceFound) {
            lastDetectionTime = Date.now();
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder("#2ecc71");
                dispatchVisibilityEvent(true);
            }
        }
    });

    // ✅ Correctif : utiliser le sélecteur CSS
    trackerTask = window.tracking.track('#localVideo', tracker);

    lastDetectionTime = Date.now();
    window.faceVisible = true;
    updateBorder("#2ecc71");
    dispatchVisibilityEvent(true);

    detectionIntervalId = setInterval(() => {
        if (window.mutualConsentGiven === true && consentTriggeredStop) {
            updateBorder("#3498db");
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
                updateBorder("#e74c3c");
                dispatchVisibilityEvent(false);
            }
        } else {
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder("#2ecc71");
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
        showTopbarLog("❌ Échec de la détection faciale (Tracking.js non chargé)", "#e74c3c");
        stopFaceDetection();
        updateBorder("#e74c3c");
    }
}

// ----------------------------
//       INIT PUBLIC
// ----------------------------
export function initFaceDetection(video, options = {}) {
    stopFaceDetection();

    videoElement = video;
    customOptions = {
        detectionTimeout: 3000,
        minFaceRatio: 0.01,
        ...options
    };

    videoElement.style.border = '4px solid #95a5a6';
    videoElement.style.boxShadow = 'none';
    
    attempts = 0;
    consentTriggeredStop = false;

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

    videoElement = null;
    window.faceVisible = false;
    lastDetectionTime = 0;

    if (videoElement) {
        videoElement.style.border = '4px solid #95a5a6';
        videoElement.style.boxShadow = 'none';
    }

    dispatchVisibilityEvent(false, true);
}

// ----------------------------
//  VALIDATION POUR MATCH.JS
// ----------------------------
export function isFaceValidated() {
    return window.faceVisible || window.mutualConsentGiven === true;
}
