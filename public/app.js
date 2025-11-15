// LegalShuffleCam • app.js (Version FINALE fonctionnelle)

const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const btnNext = document.getElementById('btnNext');
const btnMic = document.getElementById('btnMic');
const btnReport = document.getElementById('btnReport');
const reportTarget = document.getElementById('reportTarget');
const loaderRing = document.getElementById('loaderRing');

let currentStream = null;
let peer = null;
let currentCall = null;

function showMessage(msg, isError = false) {
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
    if (loaderRing) loaderRing.style.display = isError ? 'none' : 'block';
  }
  console.log((isError ? "[ERREUR] " : "[INFO] ") + msg);
}

async function detectCameras() {
  showMessage("Détection des caméras...");
  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    tempStream.getTracks().forEach(track => track.stop());
    showMessage("Permissions activées ✅");

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    showMessage(`${cameras.length} caméra(s) détectée(s)`);

    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    if (cameras.length > 0) {
      await startCamera(cameras[0].deviceId);
    } else {
      showMessage("Aucune caméra détectée", true);
    }
  } catch (error) {
    showMessage(`Erreur: ${error.message}`, true);
    console.error("Erreur détection caméras:", error);
  }
}

async function startCamera(deviceId) {
  try {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    showMessage("Activation de la caméra...");

    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : true,
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    localVideo.srcObject = stream;
    showMessage("Caméra active ✅");

    if (typeof initFaceVisible === 'function') {
      initFaceVisible(localVideo);
    }

    initPeerJS(stream);

    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }
  } catch (error) {
    showMessage(`Erreur caméra: ${error.message}`, true);
    console.error("Erreur caméra:", error);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      currentStream = fallbackStream;
      localVideo.srcObject = fallbackStream;
      showMessage("Caméra active (mode secours) ✅");
      if (typeof initFaceVisible === 'function') {
        initFaceVisible(localVideo);
      }
      initPeerJS(fallbackStream);
    } catch (fallbackError) {
      showMessage(`Erreur mode secours: ${fallbackError.message}`, true);
      console.error("Erreur mode secours:", fallbackError);
    }
  }
}

function initPeerJS(stream) {
  if (!stream) return;

  peer = new Peer(undefined, {
    host: 'legalshufflecam.ovh',
    port: 443,
    path: '/peerjs',
    secure: true,
    debug: 2
  });

  peer.on('open', id => {
    showMessage(`PeerJS connecté (ID: ${id})`);
    registerPeer(id);
  });

  peer.on('error', err => {
    showMessage(`Erreur PeerJS: ${err.message}`, true);
    console.error("Erreur PeerJS:", err);
  });

  peer.on('call', call => {
    handleIncomingCall(call);
  });
}

function registerPeer(peerId) {
  fetch("/api/register-peer", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `peerId=${encodeURIComponent(peerId)}`
  }).catch(err => {
    console.error("Erreur enregistrement peer:", err);
  });
}

function handleIncomingCall(call) {
  if (!currentStream) {
    call.close();
    showMessage("Appel rejeté: pas de flux vidéo", true);
    return;
  }

  call.answer(currentStream);
  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    showMessage("Flux distant reçu ✅");
  });

  call.on('close', () => {
    remoteVideo.srcObject = null;
    showMessage("Appel terminé");
  });

  call.on('error', err => {
    showMessage(`Erreur appel: ${err.message}`, true);
    console.error("Erreur appel:", err);
  });

  currentCall = call;
}

function handleNextClick() {
  if (!peer || !peer.id || !currentStream) {
    showMessage("PeerJS ou caméra non prêt", true);
    return;
  }

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = "⏳ Recherche...";
  }

  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }

  fetch("/api/get-peer")
    .then(res => res.json())
    .then(data => {
      if (data.partnerId && data.partnerId !== peer.id) {
        showMessage(`Connexion à ${data.partnerId}...`);
        callPeer(data.partnerId);
      } else {
        showMessage("Aucun partenaire disponible", true);
        if (btnNext) {
          btnNext.disabled = false;
          btnNext.textContent = "➡️ Interlocuteur suivant";
        }
      }
    })
    .catch(err => {
      showMessage(`Erreur: ${err.message}`, true);
      console.error("Erreur recherche partenaire:", err);
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.textContent = "➡️ Interlocuteur suivant";
      }
    });
}

function callPeer(partnerId) {
  if (!currentStream) {
    showMessage("Impossible d'appeler sans flux vidéo", true);
    return;
  }

  const call = peer.call(partnerId, currentStream);

  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    showMessage("Flux distant reçu ✅");
  });

  call.on('close', () => {
    remoteVideo.srcObject = null;
    showMessage("Appel terminé");
  });

  call.on('error', err => {
    showMessage(`Erreur appel: ${err.message}`, true);
    console.error("Erreur appel:", err);
  });

  currentCall = call;
}

window.addEventListener('load', () => {
  showMessage("Initialisation...");

  document.addEventListener('startCameraDetection', () => {
    detectCameras();
    if (cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        startCamera(e.target.value);
      });
    }
  });

  if (btnMic) {
    btnMic.addEventListener('click', () => {
      if (!currentStream) return;
      const audioTrack = currentStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        btnMic.textContent = audioTrack.enabled ? '🔊' : '🔇';
      }
    });
  }

  if (btnNext) btnNext.onclick = handleNextClick;

  window.addEventListener('beforeunload', () => {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    if (currentCall) currentCall.close();
    if (peer) peer.destroy();
  });
});