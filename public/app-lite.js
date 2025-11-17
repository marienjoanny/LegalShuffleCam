import { listCameras, startCamera } from '/js/camera.js';

window.addEventListener('DOMContentLoaded', () => {
  listCameras();

  const select = document.getElementById('cameraSelect');
  select.addEventListener('change', () => {
    const deviceId = select.value;
    if (deviceId) {
      startCamera(deviceId);
    }
  });
});
