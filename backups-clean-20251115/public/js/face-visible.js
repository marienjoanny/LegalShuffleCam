// LegalShuffleCam • face-visible.js (version optimisée)
// Détection faciale avec tracking.js et gestion des événements personnalisés.

/**
 * Initialise la détection faciale sur un flux vidéo.
 * @param {HTMLVideoElement} video - Élément vidéo source pour la détection.
 * @param {Object} [options] - Options de configuration.
 * @param {number} [options.detectionTimeout=1500] - Délai (ms) avant de considérer qu'un visage n'est plus détecté.
 * @param {number} [options.initialScale=4] - Échelle initiale du tracker.
 * @param {number} [options.stepSize=2] - Taille du pas du tracker.
 * @param {number} [options.edgesDensity=0.1] - Densité des bords pour la détection.
 */
window.initFaceVisible = function(video, options = {}) {
  if (!window.tracking || !video) {
    console.error("[FACE] tracking.js non chargé ou vidéo invalide.");
    window.faceVisible = false;
    window.dispatchEvent(new CustomEvent('faceDetectionError', {
      detail: { message: "Détection faciale non disponible." }
    }));
    return;
  }

  const {
    detectionTimeout = 1500,
    initialScale = 4,
    stepSize = 2,
    edgesDensity = 0.1
  } = options;

  const tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(initialScale);
  tracker.setStepSize(stepSize);
  tracker.setEdgesDensity(edgesDensity);

  let lastDetection = Date.now();
  window.trackerInitialized = true;

  tracking.track(video, tracker);

  tracker.on('track', (event) => {
    const detected = event.data.length > 0;
    const now = Date.now();
    const wasVisible = window.faceVisible;

    if (detected) {
      lastDetection = now;
    }

    window.faceVisible = (now - lastDetection) < detectionTimeout;

    if (wasVisible !== window.faceVisible) {
      window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible: window.faceVisible }
      }));
    }
  });

  tracker.on('error', (error) => {
    console.error("[FACE] Erreur de détection faciale :", error);
    window.dispatchEvent(new CustomEvent('faceDetectionError', {
      detail: { message: "Erreur de détection faciale.", error }
    }));
  });

  return {
    stop: () => {
      if (tracker) {
        tracker.removeAllListeners('track');
        tracking.stopTracking(video);
        window.trackerInitialized = false;
        console.log("[FACE] Détection faciale arrêtée.");
      }
    }
  };
};

window.addEventListener('faceDetectionError', (event) => {
  console.warn("[FACE] Erreur :", event.detail.message);
  if (window.topBar) {
    window.topBar.textContent = `⚠ ${event.detail.message}`;
  }
});

window.addEventListener('faceVisibilityChanged', (event) => {
  console.log(`[FACE] Visage ${event.detail.isVisible ? 'détecté' : 'non détecté'}.`);
  if (window.faceFrame) {
    window.faceFrame.style.border = event.detail.isVisible
      ? "3px solid #10b981"
      : "3px solid #ef4444";
  }
});
