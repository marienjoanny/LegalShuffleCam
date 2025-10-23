window.initFaceVisible = function(video) {
  const tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(4);
  tracker.setStepSize(2);
  tracker.setEdgesDensity(0.1);

  let lastDetection = Date.now();
  let detectionTimeout = 1500; // ms

  tracking.track(video, tracker);

  tracker.on('track', event => {
    const detected = event.data.length > 0;
    const now = Date.now();

    if (detected) {
      lastDetection = now;
    }

    window.faceVisible = (now - lastDetection) < detectionTimeout;

    const btnNext = document.getElementById("btnNext");
    const topBar = document.getElementById("topBar");

    if (btnNext) {
      btnNext.disabled = !window.faceVisible;
      btnNext.textContent = window.faceVisible
        ? "➡️ Interlocuteur suivant"
        : "🚫 Visage requis";
    }

    if (topBar) {
      topBar.textContent = window.faceVisible
        ? "✅ Visage détecté"
        : "👤 Détection faciale requise...";
    }

    video.style.border = window.faceVisible
      ? "3px solid #10b981"
      : "3px solid #dc2626";
  });
};
