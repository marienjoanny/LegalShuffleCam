// Caméra
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showMessage("getUserMedia non supporté sur ce navigateur", true);
    return;
  }

  showMessage("Détection des caméras...");

  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    tempStream.getTracks().forEach(track => track.stop());
    showMessage("Permissions activées ✅");

    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device, index) => {
      showMessage(`[${index}] ${device.kind} — ${device.label || 'non nommé'}`);
    });

