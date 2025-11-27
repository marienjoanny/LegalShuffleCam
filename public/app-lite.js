import { initMatch, nextMatch, bindMatchEvents } from "/js/match.js";
import { listCameras, startCamera } from "/js/camera.js";
// 🚨 CORRECTION : Importer les fonctions de détection pour les lier au contexte global
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
});
