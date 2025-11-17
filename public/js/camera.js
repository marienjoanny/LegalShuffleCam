export let currentStream = null;

export async function listCameras() {
  const topBar = document.getElementById('topBar');
  const cameraSelect = document.getElementById('cameraSelect');

  try {
    topBar.textContent = "📷 Détection...";
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(t => t.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');

    topBar.textContent = `📷 ${cameras.length} caméra(s)`;

    cameraSelect.innerHTML = '';
    cameras.forEach((cam, i) => {
      const opt = document.createElement('option');
      opt.value = cam.deviceId;
      opt.textContent = cam.label || (i === 0 ? 'Caméra arrière' : 'Caméra avant');
      cameraSelect.appendChild(opt);
    });

    if (cameras.length > 0) await startCamera(cameras[0].deviceId);

  } catch (err) {
    topBar.textContent = `❌ ${err.message}`;
    console.error("[CAMERA]", err);
  }
}

export async function startCamera(deviceId) {
  const localVideo = document.getElementById('localVideo');
  const topBar = document.getElementById('topBar');
  const btnNext = document.getElementById('btnNext');

  try {
    if (currentStream) currentStream.getTracks().forEach(t => t.stop());

    topBar.textContent = "📷 Activation...";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });

    currentStream = stream;
    localVideo.srcObject = stream;
    topBar.textContent = "📷 Caméra active ✅";
    if (btnNext) btnNext.disabled = false;

  } catch (err) {
    topBar.textContent = `❌ ${err.message}`;
    console.error("[CAMERA]", err);
  }
}