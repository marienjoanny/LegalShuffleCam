// LegalShuffleCam • app.js (Version FINALE avec logs visibles + patch JSON + Annuaire)

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

    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device, index) => {
      showMessage(`[${index}] ${device.kind} — ${device.label || 'non nommé'}`);
    });

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

    if (loaderRing) loaderRing.style.display = 'none';
  } catch (error) {
    showMessage(`Erreur: ${error.name} — ${error.message}`, true);
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

    const track = stream.getVideoTracks()[0];
    if (track && track.getSettings) {
      const s = track.getSettings();
      showMessage(`Résolution: ${s.width || '?'}x${s.height || '?'}`);
    }

    if (typeof initFaceVisible === 'function') {
      initFaceVisible(localVideo);
    }

    initPeerJS(stream);

    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }
  } catch (error) {
    showMessage(`Erreur caméra: ${error.name} — ${error.message}`, true);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      currentStream = fallbackStream;
      localVideo.srcObject = fallbackStream;
      showMessage("Caméra active (mode secours) ✅");
      initPeerJS(fallbackStream);
    } catch (fallbackError) {
      showMessage(`Erreur mode secours: ${fallbackError.name} — ${fallbackError.message}`, true);
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
  });

  peer.on('call', call => {
    handleIncomingCall(call);
  });
}

function registerPeer(peerId) {
  fetch("/api/register-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ partnerId: peerId })
  }).catch(err => {
    showMessage("Erreur enregistrement peer", true);
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
    .then(async res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (err) {
        throw new Error("Réponse non JSON");
      }
    })
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
  });

  currentCall = call;
}

function handleDirectCall(partnerId) {
  if (!peer || !peer.id || !currentStream) {
    showMessage("PeerJS ou caméra non prêt", true);
    return;
  }
  showMessage(`Appel direct vers ${partnerId}...`);
  callPeer(partnerId);
}

window.addEventListener('load', () => {
  showMessage("Initialisation...");
  detectCameras();

  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
      startCamera(e.target.value);
    });
  }

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

  // 🔗 Gestion du formulaire annuaire (si présent dans la page)
  const annuaireForm = document.querySelector('form[action="/api/direct-call.php"]');
  if (annuaireForm) {
    annuaireForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(annuaireForm);
      const partnerId = formData.get('partnerId');

      if (!partnerId) {
        showMessage("Aucun partenaire sélectionné", true);
        return;
      }

      try {
        const res = await fetch('/api/direct-call.php', {
          method: 'POST',
          body: formData
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data && data.partnerId) {
          handleDirectCall(data.partnerId);
        } else {
          showMessage("Réponse annuaire invalide", true);
        }
      } catch (err) {
        showMessage(`Erreur annuaire: ${err.message}`, true);
      }
    });
  }

window.startCall = handleDirectCall;


  window.addEventListener('beforeunload', () => {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    if (currentCall) currentCall.close();
    if (peer) peer.destroy();
  });
});
setInterval(() => {
  if (peer && peer.id) {
    fetch("/api/register-peer.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partnerId: peer.id })
    });
  }
}, 30000); // toutes les 30 secondes


// 🔗 Expose startCall au parent ET à l’iframe
window.startCall = handleDirectCall;
if (window !== window.parent) {
  window.parent.startCall = handleDirectCall;
}
