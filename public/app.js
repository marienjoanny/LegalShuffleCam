// LegalShuffleCam • app.js (version optimisée)
// Gère la caméra, l’audio, la détection faciale et la logique de "Next".

let currentStream = null;
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');

window.faceVisible = false;
window.trackerInitialized = false;

function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  const visible = window.faceVisible === true;
  if (btnNext) {
    btnNext.disabled = !visible;
    btnNext.textContent = visible ? '➡️ Interlocuteur suivant' : '🚫 Visage requis';
    btnNext.onclick = visible ? handleNextClick : null;
  }
}

function handleNextClick() {
  console.log("[RTC] Bouton 'Next' déclenché.");
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;
  updateNextButtonState();
  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected) {
      socket.emit("ready-for-match");
      updateTopBar("🔍 Recherche d’un partenaire...");
    }
  }, 1500);
}

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      videoInputs.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }
    if (videoInputs.length > 0) {
      await startCamera(videoInputs[0].deviceId);
    } else {
      updateTopBar("❌ Aucune caméra détectée.");
    }
  } catch (err) {
    console.error("[RTC] Erreur détection caméra:", err);
    updateTopBar("❌ Erreur caméra. Vérifiez les permissions.");
  }
}

async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    });
    currentStream = stream;
    if (localVideo) localVideo.srcObject = stream;
    updateTopBar("✅ Caméra active. Détection en cours...");

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }
    if (typeof window.connectSocketAndWebRTC === "function" && currentStream) {
      window.connectSocketAndWebRTC(currentStream);
    }
  } catch (err) {
    console.error("[RTC] Erreur caméra:", err);
    updateTopBar("❌ Caméra refusée ou indisponible.");
  }
}

if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

if (btnSpeaker && remoteVideo) {
  btnSpeaker.addEventListener('click', () => {
    remoteVideo.muted = !remoteVideo.muted;
    btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
  });
}

window.addEventListener('faceVisibilityChanged', updateNextButtonState);

window.addEventListener('load', () => {
  listCameras();
  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    if (typeof window.disconnectWebRTC === 'function') {
      window.disconnectWebRTC();
    }
  });
});

updateNextButtonState();
