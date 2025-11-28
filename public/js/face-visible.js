// LegalShuffleCam • face-visible.js (Module ES)
// Détection faciale avec tracking.js, filtrage sur la taille du visage et respect du consentement mutuel

let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let options = {};
let isTrackerRunning = false;

const container = document.getElementById('localVideoContainer'); 

window.faceVisible = false;

function updateBorder(isVisible) {
    if (!container) return;

    // 🛑 Consentement mutuel actif → bordure bleue
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

function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));
}

function startTrackingInternal() {
    if (isTrackerRunning || !videoElement) return;

    tracker = new window.tracking.ObjectTracker('face');
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0);
    tracker.setEdgesDensity(0.1);
    tracker.setSkip(10);

    console.log("Tracking.js: Détection démarrée avec filtrage ratio ≥ 30%.");

    tracker.on('track', function(event) {
        if (window.mutualConsentGiven) return; // 🔒 Respect du consentement mutuel

        if (event.data.length > 0) {
            const videoArea = videoElement.videoWidth * videoElement.videoHeight;
            let valid = false;

            event.data.forEach(rect => {
                const faceArea = rect.width * rect.height;
                const ratio = faceArea / videoArea;
                if (ratio >= 0.3) { // ✅ seuil 30%
                    valid = true;
                }
            });

            if (valid) {
                lastDetectionTime = Date.now();
                if (!window.faceVisible) {
                    window.faceVisible = true;
                    updateBorder(true);
                    dispatchVisibilityEvent(true);
                }
            }
        }
    });

    window.tracking.track(videoElement, tracker); 
    isTrackerRunning = true;
    lastDetectionTime = Date.now();

    detectionIntervalId = setInterval(() => {
        if (window.mutualConsentGiven) {
            updateBorder(true); // 🔒 Bordure bleue
            return;
        }

        const timeSinceLastDetection = Date.now() - lastDetectionTime;

        if (timeSinceLastDetection > options.detectionTimeout) {
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

    updateBorder(window.faceVisible); 
    dispatchVisibilityEvent(window.faceVisible);
}

export function initFaceDetection(video, customOptions = {}) {
    if (!container) {
        console.error("Erreur Face Detection: Le conteneur #localVideoContainer est introuvable.");
        return;
    }
    
    stopFaceDetection();

    videoElement = video;
    options = {
        detectionTimeout: 3000,
        ...customOptions
    };

    container.style.border = '4px solid #95a5a6';
    container.style.boxShadow = 'none';

    videoElement.addEventListener('canplay', startTrackingInternal, { once: true });

    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) { 
        console.log("Flux vidéo déjà actif, démarrage immédiat du tracker.");
        startTrackingInternal();
    }
}

export function stopFaceDetection() {
    if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
        detectionIntervalId = null;
    }
    
    if (videoElement) {
        videoElement.removeEventListener('canplay', startTrackingInternal);
    }
    
    tracker = null;
    isTrackerRunning = false;
    videoElement = null;

    window.faceVisible = false;
    lastDetectionTime = 0;

    if (container) {
        container.style.border = '4px solid #95a5a6';
        container.style.boxShadow = 'none';
    }

    dispatchVisibilityEvent(false, true); 
    console.log("Tracking.js: Tracker arrêté et nettoyé.");
}