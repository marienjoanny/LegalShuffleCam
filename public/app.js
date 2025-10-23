// LegalShuffleCam • app.js réécrit v2
let currentStream = null;

const topBar        = document.getElementById('topBar');
const remoteVideo   = document.getElementById('remoteVideo');
const localVideo    = document.getElementById('localVideo');
const btnSpeaker    = document.getElementById('btnMic');
const btnNext       = document.getElementById('btnNext');
const cameraSelect  = document.getElementById('cameraSelect');
const faceFrame     = document.getElementById("faceFrame");

window.faceVisible = false;

window.checkUIUpdate = function () {
  if (faceFrame) {
    faceFrame.style.border = window.faceVisible ? "3px solid #10b981" : "3px solid #dc2626";
  }
  if (topBar) {
    topBar.textContent = window.faceVisible
      ? "✅ Visage OK. Prêt à chercher un partenaire."
      : "👤 Détection faciale requise...";
  }
};

setInterval(() => {
  if (typeof window.checkUIUpdate === "function") {
    window.checkUIUpdate();
  }
}, 500);

async function listCameras() {
  if (!cameraSelect) return console.warn("[RTC] cameraSelect introuvable");

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');
    cameraSelect.innerHTML = '';

    videoInputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = `Cam ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    if (videoInputs.length > 0) {
      startCamera(videoInputs[0].deviceId);
    } else {
      if (topBar) topBar.textContent = "❌ Aucune caméra détectée";
    }
  } catch (err) {
    console.error("[RTC] Erreur enumerateDevices:", err.message);
    if (topBar) topBar.textContent = "❌ Caméra non trouvée.";
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
    localVideo.srcObject = stream;

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    if (typeof window.connectSocketAndWebRTC === "function") {
      window.connectSocketAndWebRTC(stream);
    }

    if (topBar) topBar.textContent = "✅ Caméra active, détection en cours...";
  } catch (err) {
    console.error("[RTC] Caméra indisponible:", err.message);
    if (topBar) topBar.textContent = "❌ Caméra refusée ou indisponible.";
  }
}

window.startCamera = startCamera;

if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => {
    startCamera(e.target.value);
  });
}

listCameras();

setTimeout(() => {
  console.log("[AUDIT] localVideo.srcObject:", localVideo?.srcObject);
  console.log("[AUDIT] localVideo.readyState:", localVideo?.readyState);
  console.log("[AUDIT] faceVisible:", window.faceVisible);
  console.log("[AUDIT] trackerInitialized:", window.trackerInitialized);
  if (topBar) console.log("[AUDIT] topBar:", topBar.textContent);
}, 3000);

if (btnSpeaker && remoteVideo) {
  btnSpeaker.addEventListener('click', () => {
    remoteVideo.muted = !remoteVideo.muted;
    btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
  });
}

if (btnNext) {
  setInterval(() => {
    const visible = window.faceVisible === true;
    btnNext.disabled = !visible;
    btnNext.textContent = visible ? '➡️ Interlocuteur suivant' : '🚫 Visage requis';

    if (visible && !btnNext.onclick) {
      btnNext.onclick = () => {
        if (typeof disconnectWebRTC === 'function') disconnectWebRTC();
        remoteVideo.srcObject = null;
        btnNext.disabled = true;
        setTimeout(() => {
          if (typeof socket !== 'undefined') socket.emit("ready-for-match");
        }, 1500);
      };
    } else if (!visible) {
      btnNext.onclick = null;
    }
  }, 500);
}
