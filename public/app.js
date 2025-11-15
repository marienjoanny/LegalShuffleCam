// LegalShuffleCam • app.js (PeerJS version complète)
// Caméra ultra-stable + signalisation PeerJS + logs dans topBar

let currentStream = null;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const topBar = document.getElementById('topBar');
const btnNext = document.getElementById('btnNext');

function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function logToTopBar(message) {
  if (topBar) topBar.textContent = "🛠 " + message;
  console.log(message);
}

async function listCameras() {
  try {
    logToTopBar("📷 Activation caméra pour détecter les périphériques…");
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(track => track.stop());

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
      logToTopBar("✅ Caméras détectées");
      startCamera(videoInputs[0].deviceId);
    } else {
      logToTopBar("❌ Aucune caméra détectée (permissions ? HTTPS ?)");
    }
  } catch (err) {
    console.error("Erreur caméra:", err);
    logToTopBar("❌ Erreur de détection des caméras");
  }
}

async function startCamera(deviceId) {
  try {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    logToTopBar("📷 Accès à la caméra…");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    });

    currentStream = stream;
    if (localVideo) localVideo.srcObject = stream;
    logToTopBar("✅ Caméra active");

    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }
  } catch (err) {
    console.error("Erreur caméra:", err);
    logToTopBar("❌ Erreur caméra");

    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      logToTopBar("✅ Caméra active (mode compatible)");
    } catch (fallbackErr) {
      console.error("Erreur fallback:", fallbackErr);
    }
  }
}

const peer = new Peer(undefined, {
  host: 'legalshufflecam.ovh',
  port: 443,
  path: '/peerjs',
  secure: true
});

peer.on('open', id => {
  logToTopBar("📡 Mon PeerJS ID: " + id);
  fetch("register-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "peerId=" + encodeURIComponent(id)
  });
});

peer.on('call', call => {
  logToTopBar("📞 Appel entrant de " + call.peer);
  call.answer(currentStream);
  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    logToTopBar("📺 Flux distant reçu");
  });
});

function callPeer(partnerId) {
  logToTopBar("📞 Appel vers " + partnerId);
  const call = peer.call(partnerId, currentStream);
  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    logToTopBar("📺 Flux distant reçu");
  });
}

function handleNextClick() {
  if (remoteVideo) remoteVideo.srcObject = null;
  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = "⏳ Recherche…";
  }

  if (!peer || !peer.id || !currentStream) {
    logToTopBar("❌ PeerJS non prêt");
    return;
  }

  fetch("get-peers.php")
    .then(res => res.json())
    .then(data => {
      if (data.partnerId) {
        logToTopBar("🔗 Connexion à " + data.partnerId);
        callPeer(data.partnerId);
      } else {
        logToTopBar("❌ Aucun partenaire disponible");
      }
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.textContent = "➡️ Interlocuteur suivant";
      }
    });
}

window.addEventListener('load', () => {
  listCameras();
  if (btnNext) btnNext.onclick = handleNextClick;
  if (cameraSelect) {
    cameraSelect.addEventListener('change', e => {
      startCamera(e.target.value);
    });
  }
  window.addEventListener('beforeunload', () => {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
  });
});
