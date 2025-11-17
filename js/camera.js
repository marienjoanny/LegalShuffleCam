export async function listCameras(selectId = 'cameraSelect', topBarId = 'topBar') {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoInputs = devices.filter(d => d.kind === 'videoinput');

  const select = document.getElementById(selectId);
  const topBar = document.getElementById(topBarId);
  select.innerHTML = '';

  videoInputs.forEach((device, index) => {
    const option = document.createElement('option');
    option.value = device.deviceId;
    option.textContent = device.label || \`Caméra \${index + 1}\`;
    select.appendChild(option);
  });

  if (videoInputs.length === 0) {
    const option = document.createElement('option');
    option.textContent = '❌ Aucune caméra détectée';
    select.appendChild(option);
    topBar.textContent = '❌ Aucune caméra détectée';
  } else {
    topBar.textContent = \`🎥 \${videoInputs.length} caméra(s) détectée(s)\`;
  }

  console.log("🎥 Caméras détectées :", videoInputs);
}

export async function startCamera(deviceId, videoId = 'localVideo', topBarId = 'topBar') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false
    });

    const video = document.getElementById(videoId);
    const topBar = document.getElementById(topBarId);

    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      topBar.textContent = "✅ Caméra activée";
      console.log("🎥 Caméra activée :", deviceId);
    };
  } catch (err) {
    document.getElementById(topBarId).textContent = "❌ Erreur caméra";
    console.error("⛔ Erreur caméra :", err);
  }
}
