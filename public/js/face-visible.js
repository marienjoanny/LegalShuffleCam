// face-visible.js - Version Standard Globale (Fix pour Index-real)
(function() {
    let videoElement, tracker, trackerTask, detectionIntervalId, customOptions;
    let lastDetectionTime = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 50;

    function dispatchVisibilityEvent(isVisible, ratio = 0) {
        window.dispatchEvent(new CustomEvent('faceStatusUpdate', { 
            detail: { isValid: isVisible, ratio: ratio } 
        }));
    }

    function startTrackingInternal() {
        tracker = new tracking.ObjectTracker('face');
        tracker.setInitialScale(4);
        tracker.setStepSize(2);
        tracker.setEdgesDensity(0.1);

        trackerTask = tracking.track(videoElement, tracker);

        tracker.on('track', event => {
            const now = Date.now();
            let maxRatio = 0;

            if (event.data.length > 0) {
                const videoArea = videoElement.videoWidth * videoElement.videoHeight;
                event.data.forEach(rect => {
                    const ratio = (rect.width * rect.height) / videoArea;
                    if (ratio > maxRatio) maxRatio = ratio;
                    
                    if (ratio >= customOptions.minFaceRatio) {
                        lastDetectionTime = now;
                    }
                });
            }

            // On envoie le ratio à chaque tick pour la TopBar
            const isVisible = (now - lastDetectionTime) < customOptions.detectionTimeout;
            dispatchVisibilityEvent(isVisible, maxRatio);
        });
    }

    window.initFaceDetection = function(video, options = {}) {
        if (trackerTask) window.stopFaceDetection();

        videoElement = video;
        customOptions = {
            detectionTimeout: 2000,
            minFaceRatio: 0.3, // Tes 30% sont ici
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
        dispatchVisibilityEvent(false, 0);
    };
})();
