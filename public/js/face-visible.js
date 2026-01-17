// face-visible.js - Version Standard Globale (Fixée & Sécurisée)
(function() {
    let trackerTask = null;
    let tracker = null;
    let lastDetectionTime = 0;
    let detectionIntervalId = null;
    let videoElement = null;
    let customOptions = {};
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    const showTopbarLog = (msg, color) => {
        const topBar = document.getElementById("topBar");
        if (topBar) {
            topBar.textContent = msg;
            if (color) topBar.style.backgroundColor = color;
            topBar.style.color = "white";
        }
    };

    if (typeof window.mutualConsentGiven === 'undefined') window.mutualConsentGiven = false;
    window.faceVisible = false;

    function updateBorder(color) {
        if (!videoElement) return;
        videoElement.style.border = `4px solid ${color}`;
        videoElement.style.boxShadow = `0 0 10px ${color}`;
    }

    function dispatchVisibilityEvent(isVisible, ratio = 0) {
        // Envoi de l'événement pour l'index-real.php
        window.dispatchEvent(new CustomEvent('faceStatusUpdate', {
            detail: { isValid: isVisible, ratio: ratio }
        }));

        if (!window.mutualConsentGiven) {
            const pct = Math.round((customOptions.minFaceRatio || 0.3) * 100);
            const message = isVisible 
                ? `✅ Visage détecté (≥${pct}%)` 
                : `❌ Visage requis (min ${pct}%)`;
            showTopbarLog(message, isVisible ? "#1abc9c" : "#e67e22");
        }
    }

    function startTrackingInternal() {
        tracker = new tracking.ObjectTracker('face');
        tracker.setInitialScale(4);
        tracker.setStepSize(2);
        tracker.setEdgesDensity(0.1);

        tracker.on('track', event => {
            const now = Date.now();
            let maxRatioFound = 0;

            if (event.data.length > 0) {
                const videoArea = videoElement.videoWidth * videoElement.videoHeight;
                event.data.forEach(rect => {
                    const ratio = (rect.width * rect.height) / videoArea;
                    if (ratio > maxRatioFound) maxRatioFound = ratio;
                    if (ratio >= customOptions.minFaceRatio) {
                        lastDetectionTime = now;
                    }
                });
            }

            const isVisible = (now - lastDetectionTime) < customOptions.detectionTimeout;
            dispatchVisibilityEvent(isVisible, maxRatioFound);
            
            if (window.mutualConsentGiven) {
                updateBorder("#3498db");
            } else {
                updateBorder(isVisible ? "#2ecc71" : "#e74c3c");
            }
        });

        trackerTask = tracking.track(videoElement, tracker);
    }

    window.initFaceDetection = function(video, options = {}) {
        if (trackerTask) window.stopFaceDetection();

        videoElement = video;
        customOptions = {
            detectionTimeout: 2500,
            minFaceRatio: 0.3,
            ...options
        };

        const checkReady = () => {
            if (typeof tracking !== 'undefined' && tracking.ObjectTracker) {
                startTrackingInternal();
            } else if (attempts < MAX_ATTEMPTS) {
                attempts++;
                setTimeout(checkReady, 100);
            }
        };
        checkReady();
    };

    window.stopFaceDetection = function() {
        if (detectionIntervalId) clearInterval(detectionIntervalId);
        if (trackerTask) trackerTask.stop();
        if (tracker) tracker.removeAllListeners();
        window.faceVisible = false;
        dispatchVisibilityEvent(false, 0);
    };
})();
