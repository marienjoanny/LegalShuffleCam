// LegalShuffleCam • face-visible.js réécrit
window.initFaceVisible = function(videoElement) {
  if (!videoElement || window.trackerInitialized) return;

  const tracker = new tracking.ObjectTracker("face");
  tracker.setInitialScale(2);
  tracker.setStepSize(1.5);
  tracker.setEdgesDensity(0.05);

  const history = Array(30).fill(0);
  window.okStreak = 0;

  videoElement.onloadedmetadata = () => {
    videoElement.play();
    console.log("[FaceVisible] Vidéo prête, lancement tracking...");
    tracking.track(`#${videoElement.id}`, tracker);
  };

  tracker.on("track", event => {
    const face = event.data[0];
    const visible = !!face;

    window.okStreak = visible
      ? Math.min(window.okStreak + 1, 30)
      : Math.max(window.okStreak - 1, 0);

    history.shift();
    history.push(window.okStreak >= 15 ? 1 : 0);

    const sum = history.reduce((a, b) => a + b, 0);
    window.faceVisible = sum >= 15;

    const faceFrame = document.getElementById("faceFrame");
    if (faceFrame) {
      faceFrame.style.border = window.faceVisible
        ? "3px solid #10b981"
        : "3px solid #dc2626";
    }

    const btnNext = document.getElementById("btnNext");
    if (btnNext) {
      btnNext.disabled = !window.faceVisible;
      btnNext.textContent = window.faceVisible
        ? "➡️ Interlocuteur suivant"
        : "🚫 Visage requis";
    }

    const topBar = document.getElementById("topBar");
    if (topBar) {
      topBar.textContent = window.faceVisible
        ? "✅ Visage OK. Prêt à chercher un partenaire."
        : "👤 Détection faciale requise...";
    }

    console.log("[RTC] 🔍 Visage détecté:", visible, "| Streak:", window.okStreak, "| faceVisible:", window.faceVisible);
  });

  window.trackerInitialized = true;
};
