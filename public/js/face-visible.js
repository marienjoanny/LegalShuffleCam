// LegalShuffleCam • face-visible.js réécrit

window.initFaceVisible = function(video) {
  const tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);

  let lastDetection = Date.now();
  const detectionTimeout = 1500; // ms

  window.trackerInitialized = true;

  tracking.track(video, tracker);

  tracker.on('track', event => {
    const detected = event.data.length > 0;
    const now = Date.now();

    if (detected) {
      lastDetection = now;
    }

    window.faceVisible = (now - lastDetection) < detectionTimeout;
  });
};
