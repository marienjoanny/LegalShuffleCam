export let currentStream = null;

export async function listCameras() {
  const topBar = document.getElementById('topBar');
  const cameraSelect = document.getElementById('cameraSelect');

  try {
    topBar.textContent = "📷 Détection des caméras...";
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(track => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');

    topBar.textContent = `📷 ${cameras.length} caméra(s) détectée(s)`;

    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || (index === 0 ? 'Caméra arrière' : 'Caméra avant');
        cameraSelect.appendChild(option);
      });
    }

    if (cameras.length > 0) {
      await startCamera(cameras[0].deviceId);
    }

  } catch (err) {
    topBar.textContent = `❌ Erreur caméra: ${err.message}`;
    console.error("[CAMERA] Erreur:", err);
  }
}

export async function startCamera(deviceId) {
  const localVideo = document.getElementById('localVideo');
  const topBar = document.getElementById('topBar');
  const btnNext = document.getElementById('btnNext');

  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    topBar.textContent = "📷 Activation de la caméra...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId ? { exact: deviceId } : true,
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    currentStream = stream;
    localVideo.srcObject = stream;
    topBar.textContent = "📷 Caméra active ✅";

    if (btnNext) btnNext.disabled = false;

  } catch (err) {
    topBar.textContent = `❌ Erreur caméra: ${err.message}`;
    console.error("[CAMERA] Erreur:", err);
  }
}
