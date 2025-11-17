// UI / topBar
    topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
    if (loaderRing) loaderRing.style.display = isError ? 'none' : 'block';
  }
}

async function detectCameras() {
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
