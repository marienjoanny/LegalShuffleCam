import { initMatch, nextMatch, bindMatchEvents } from "/js/match.js";
import { listCameras, startCamera } from "/js/camera.js";
import { initFaceDetection, stopFaceDetection } from "/js/face-visible.js";

window.addEventListener('DOMContentLoaded', () => {
  listCameras();
  initMatch();
  bindMatchEvents();

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