// =======================================================
// LegalShuffleCam • face-visible.js
// Détection de visage avec tracking.js
// Active/désactive dynamiquement le bouton "Suivant"
// =======================================================

window.initFaceVisible = function(videoElement) {
  if (!videoElement || window.trackerInitialized) return;

  console.log("[FaceVisible] Initialisation du suivi facial...");

  const tracker = new tracking.ObjectTracker("face");
  tracker.setInitialScale(2);
  tracker.setStepSize(1.5);
  tracker.setEdgesDensity(0.05);

  const history = Array(30).fill(0);
  window.okStreak = 0;
  window.faceVisible = false;

  // Lancer le tracking quand la vidéo est prête
  videoElement.onloadedmetadata = () => {
    try {
      videoElement.play().catch(err =>
        console.warn("[FaceVisible] Erreur lecture vidéo:", err)
      );
      console.log("[FaceVisible] Vidéo détectée, lancement du tracking...");
      tracking.track(`#${videoElement.id}`, tracker);
    } catch (e) {
      console.error("[FaceVisible] Erreur de lancement tracking:", e);
    }
  };

  tracker.on("track", event => {
    const face = event.data[0];
    const visible = !!face;

    // Maintenir un "streak" de détection
    window.okStreak = visible
      ? Math.min(window.okStreak + 1, 30)
      : Math.max(window.okStreak - 1, 0);

    history.shift();
    history.push(window.okStreak >= 15 ? 1 : 0);

    const sum = history.reduce((a, b) => a + b, 0);
    window.faceVisible = sum >= 15;

    // UI — cadre vidéo
    const faceFrame = document.getElementById("faceFrame");
    if (faceFrame) {
      faceFrame.style.border = window.faceVisible
        ? "3px solid #10b981" // vert
        : "3px solid #dc2626"; // rouge
    }

    // UI — bouton "Suivant"
    const btnNext = document.getElementById("btnNext");
    if (btnNext) {
      btnNext.disabled = !window.faceVisible;
      btnNext.textContent = window.faceVisible
        ? "➡️ Interlocuteur suivant"
        : "🚫 Visage requis";
    }

    // UI — barre d’état
    const topBar = document.getElementById("topBar");
    if (topBar) {
      topBar.textContent = window.faceVisible
        ? "✅ Visage OK. Prêt à chercher un partenaire."
        : "👤 Détection faciale requise...";
    }

    console.log(
      `[FaceVisible] Visage:${visible ? "✔" : "❌"} | Streak:${window.okStreak} | faceVisible:${window.faceVisible}`
    );
  });

  window.trackerInitialized = true;
  console.log("[FaceVisible] Tracker initialisé avec succès.");
};
