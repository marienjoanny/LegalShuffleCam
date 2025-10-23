window.initFaceVisible = function(video) {
  const tracker = new tracking.ObjectTracker('face');
  tracker.setInitialScale(2);
  tracker.setStepSize(1.5);
  tracker.setEdgesDensity(0.05);

  let history = new Array(30).fill(0);
  window.faceVisible = false;

  tracking.track(video, tracker);

  tracker.on('track', event => {
    const detected = event.data.length > 0 ? 1 : 0;
    history.shift();
    history.push(detected);

    const sum = history.reduce((a, b) => a + b, 0);
    window.faceVisible = sum >= 15;

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

    console.log(`[FaceVisible] detected:${detected} | sum:${sum} | faceVisible:${window.faceVisible}`);
  });
};
