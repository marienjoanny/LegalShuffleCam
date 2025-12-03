// app-lite.js
import { initMatch, nextMatch, bindMatchEvents } from "/js/match.js";
import { listCameras, startCamera } from "/js/camera.js";
import { initFaceDetection, stopFaceDetection } from "/js/face-visible.js";
import { showTopbarLog } from "/js/utilities.js";

window.addEventListener('DOMContentLoaded', () => {
  // 🎥 Liste des caméras disponibles
  listCameras();

  // 🔗 Initialisation PeerJS + Match
  initMatch();
  bindMatchEvents();

  // 🎛️ Sélecteur de caméra
  const select = document.getElementById('cameraSelect');
  select.addEventListener('change', () => {
    const deviceId = select.value;
    if (deviceId) {
      startCamera(deviceId);
    }
  });

  // ✅ Patch terrain : démarrage détection après lecture réelle
  const localVideo = document.getElementById("localVideo");
  if (localVideo) {
    localVideo.addEventListener('playing', () => {
      showTopbarLog("📺 Lecture confirmée, relance détection", "#2ecc71");
      initFaceDetection(localVideo, { detectionTimeout: 3000 });
    }, { once: true });
  }
});