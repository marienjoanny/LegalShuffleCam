import { initMatch, nextMatch, bindMatchEvents } from "/js/match.js";
import { listCameras, startCamera } from "/js/camera.js";
import { initFaceDetection, stopFaceDetection } from "/js/face-visible.js";

window.addEventListener('DOMContentLoaded', () => {
  // Initialisation des caméras et du match
  listCameras();
  initMatch();
  bindMatchEvents();

  const select = document.getElementById('cameraSelect');
  const localVideo = document.getElementById("localVideo");

  // Changement de caméra → arrêt détection puis redémarrage
  if (select) {
    select.addEventListener('change', () => {
      stopFaceDetection();
      const deviceId = select.value;
      if (deviceId) {
        startCamera(deviceId);
      }
    });
  }

  // Démarrage détection après lecture réelle
  if (localVideo) {
    localVideo.addEventListener('playing', () => {
      showTopbarLog("📺 Lecture confirmée, relance détection", "#2ecc71");
      initFaceDetection(localVideo, { detectionTimeout: 3000, minFaceRatio: 0.01 });
    }, { once: true });
  }

  // Écoute des événements de face-visible.js
  window.addEventListener('faceVisibilityChanged', e => {
    const { isVisible, isStopped } = e.detail;
    console.log("Face visibility:", isVisible, "stopped:", isStopped);

    // Exemple : activer/désactiver bouton Suivant
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.disabled = !isVisible && !window.mutualConsentGiven;
    }
  });

  window.addEventListener('facesDetected', e => {
    console.log("Nombre de visages détectés:", e.detail.count);

    // Exemple : afficher compteur dans l'UI
    const facesCountSpan = document.getElementById("facesCount");
    if (facesCountSpan) {
      facesCountSpan.textContent = e.detail.count;
    }
  });
});
