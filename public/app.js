// LegalShuffleCam • app.js (version enrichie avec signalement rétroactif + TURN coturn)

let currentStream = null;
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');
const reportSelect = document.getElementById('reportTarget');
const reportBtn = document.getElementById('btnReport');

window.faceVisible = false;
window.trackerInitialized = false;

const recentPartners = [];

const rtcConfig = {
  iceServers: [
    {
      urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
      username: 'user',
      credential: '6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c'
    }
  ],
  sdpSemantics: 'unified-plan'
};

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
      window.connectSocketAndWebRTC(currentStream, rtcConfig);
    }

  } catch (err) {
    console.warn("[RTC] 🎯 Échec avec deviceId exact, tentative sans contrainte…", err);

    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      updateTopBar("✅ Caméra fallback active.");

      if (typeof window.initFaceVisible === "function") {
        window.initFaceVisible(localVideo);
      }

      if (typeof window.connectSocketAndWebRTC === "function" && currentStream) {
        window.connectSocketAndWebRTC(currentStream, rtcConfig);
      }

    } catch (fallbackErr) {
      console.error("[RTC] ❌ Erreur caméra (fallback échoué):", fallbackErr);
      updateTopBar("❌ Caméra refusée ou indisponible.");
    }
  }
}

function capturePartnerSnapshot(remoteId, ip) {
  const canvas = document.createElement("canvas");
  canvas.width = remoteVideo.videoWidth;
  canvas.height = remoteVideo.videoHeight;
  canvas.getContext("2d").drawImage(remoteVideo, 0, 0);
  const imageData = canvas.toDataURL("image/jpeg");

  recentPartners.unshift({
    remoteId,
    ip,
    image: imageData,
    timestamp: new Date().toISOString()
  });

  if (recentPartners.length > 5) recentPartners.pop();
  updateReportList();
}

window.connectSocketAndWebRTC = function (stream, config) {
  const peerConnection = new RTCPeerConnection(config);

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      const cand = event.candidate.candidate;
      if (cand.includes('typ relay')) {
        updateTopBar("🔐 Connexion sécurisée via TURN");
      } else if (cand.includes('typ srflx')) {
        updateTopBar("🌐 Connexion STUN");
      } else if (cand.includes('typ host')) {
        updateTopBar("📡 Connexion directe");
      }
    }
  };

  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream);

  socket.on("partner-info", ({ remoteId, ip }) => {
    capturePartnerSnapshot(remoteId, ip);
  });

  // Ajoute ici ton signaling (offer/answer via socket)
};

function updateReportList() {
  if (!reportSelect) return;
  reportSelect.innerHTML = '<option disabled selected>Choisir un interlocuteur</option>';
  recentPartners.forEach((p, i) => {
    reportSelect.innerHTML += `<option value="${i}">#${i + 1} • ${p.remoteId} • ${new Date(p.timestamp).toLocaleTimeString()}</option>`;
  });
}

if (reportBtn) {
  reportBtn.addEventListener("click", () => {
    const index = reportSelect.value;
    const partner = recentPartners[index];
    const reason = prompt("Motif du signalement :");

    if (!reason || !partner) return;

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...partner,
        reason,
        reporterId: socket.id
      })
    }).then(res => {
      alert(res.ok ? "✅ Signalement transmis" : "❌ Échec du signalement");
    });
  });
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