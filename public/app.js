// LegalShuffleCam • app.js (version enrichie avec signalement rétroactif + TURN coturn + alertes debug)

let currentStream = null;
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');
const reportSelect = document.getElementById('reportTarget');
const reportBtn = document.getElementById('btnReport');

window.faceVisible = true; // 👈 Visage toujours considéré comme visible
window.trackerInitialized = false;

const recentPartners = [];

const rtcConfig = {
  iceServers: [
    { urls: 'turn:legalshufflecam.ovh:3478?transport=udp', username: 'webrtc', credential: 'secret' },
    { urls: 'turn:legalshufflecam.ovh:5349?transport=tcp', username: 'webrtc', credential: 'secret' },
    { urls: 'turn:legalshufflecam.ovh:443?transport=tcp', username: 'webrtc', credential: 'secret' },
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  sdpSemantics: 'unified-plan'
};

function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  const visible = true; // 👈 forcé à toujours vrai
  if (btnNext) {
    btnNext.disabled = false;
    btnNext.textContent = '➡️ Interlocuteur suivant';
    btnNext.onclick = handleNextClick;
  }
}

function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;
  updateNextButtonState();
  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected) {
      socket.emit("ready-for-match");
      updateTopBar("🔍 Recherche d’un partenaire...");
    } else {
      updateTopBar("❌ Connexion perdue. Rechargez la page.");
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

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

  } catch (err) {
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

      window.faceVisible = true;
      window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

    } catch (fallbackErr) {
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
      console.log('[ICE] Candidate:', cand);
      if (cand.includes('typ relay')) {
        updateTopBar("🔐 Connexion sécurisée via TURN");
      } else if (cand.includes('typ srflx')) {
        updateTopBar("🌐 Connexion STUN");
      } else if (cand.includes('typ host')) {
        updateTopBar("📡 Connexion directe");
      }
    }
  };

  peerConnection.onconnectionstatechange = () => {
    alert("🔄 État WebRTC : " + peerConnection.connectionState);
  };

  peerConnection.oniceconnectionstatechange = () => {
    alert("❄️ ICE state : " + peerConnection.iceConnectionState);
  };

  peerConnection.ontrack = (event) => {
    alert("📺 Flux reçu !");
    remoteVideo.srcObject = event.streams[0];
  };

  stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

  socket.on("partner-info", ({ remoteId, ip }) => {
    capturePartnerSnapshot(remoteId, ip);
  });

  // Signaling offer/answer à ajouter ici
};

function updateReportList() {
  if (!reportSelect) return;
  reportSelect.innerHTML = '<option disabled selected>Choisir un interlocuteur</option>';
  recentPartners.forEach((p, i) => {
    reportSelect.innerHTML += `<option value="${i}">#${i + 1} • ${p.remoteId} • ${new Date(p.timestamp).toLocaleTimeString()}</option>`;
  });
}

if (reportBtn && reportSelect) {
  reportBtn.addEventListener("click", () => {
    reportSelect.classList.toggle("visible");
  });

  reportSelect.addEventListener("change", () => {
    const index = reportSelect.value;
    const partner = recentPartners[index];
    const reason = prompt("Motif du signalement :");

    if (!reason || !partner) {
      alert("❌ Signalement annulé.");
      return;
    }

    alert("🚀 Envoi du signalement...\n" +
          "ID signalé : " + partner.remoteId + "\n" +
          "IP : " + partner.ip + "\n" +
          "Motif : " + reason);

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...partner,
        reason,
        reporterId: socket.id
      })
    }).then(res => {
      alert(res.ok ? "✅ Signalement transmis au serveur" : "❌ Échec du signalement");
    }).catch(err => {
      alert("❌ Erreur réseau : " + err.message);
    });

    reportSelect.classList.remove("visible");
    reportSelect.selectedIndex = 0;
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