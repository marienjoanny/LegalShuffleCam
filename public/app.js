// LegalShuffleCam • app.js
// Version ultra-simplifiée avec PeerJS

// Éléments DOM nécessaires
let currentStream = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const cameraSelect = document.getElementById('cameraSelect');
const btnNext = document.getElementById('btnNext');
const remoteVideo = document.getElementById('remoteVideo');

// Variables PeerJS
let peer = null;
let currentCall = null;

// Fonction pour afficher les messages dans la topBar
function showMessage(message, isError = false) {
  topBar.textContent = (isError ? "❌ " : "📡 ") + message;
}

// Fonction pour lister les caméras
async function listCameras() {
  try {
    showMessage("Détection des caméras...");

    // Obtenir la liste des périphériques
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    // Remplir le sélecteur de caméras
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
      showMessage(`${videoInputs.length} caméra(s) détectée(s)`);
      startCamera(videoInputs[0].deviceId);
    } else {
      showMessage("Aucune caméra détectée", true);
    }
  } catch (err) {
    showMessage(`Erreur: ${err.message}`, true);
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    showMessage("Activation de la caméra...");

    // Contraintes minimales
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      showMessage("Caméra active ✅");
    }

    // Activer le bouton
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }

    // Initialiser PeerJS
    initPeerJS();

  } catch (err) {
    showMessage(`Erreur caméra: ${err.message}`, true);

    // Tentative de secours
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      showMessage("Caméra active (mode compatible) ✅");
      initPeerJS();
    } catch (fallbackErr) {
      showMessage(`Erreur: ${fallbackErr.message}`, true);
    }
  }
}

// Initialisation de PeerJS
function initPeerJS() {
  if (!currentStream) return;

  showMessage("Initialisation de PeerJS...");

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
    setTimeout(initPeerJS, 5000); // Réessayer après 5 secondes
  });

  peer.on('call', call => {
    handleIncomingCall(call);
  });
}

// Enregistrement du peer ID
function registerPeer(peerId) {
  fetch("register-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `peerId=${encodeURIComponent(peerId)}`
  })
  .catch(err => {
    showMessage(`Erreur enregistrement: ${err.message}`, true);
  });
}

// Gestion des appels entrants
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

// Gestion du bouton "Interlocuteur suivant"
function handleNextClick() {
  if (!peer || !peer.id || !currentStream) {
    showMessage("PeerJS ou caméra non prêt", true);
    return;
  }

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = "⏳ Recherche...";
  }

  // Fermer l'appel actuel s'il existe
  if (currentCall) {
    currentCall.close();
    currentCall = null;
  }

  // Obtenir un partenaire
  fetch("get-peers.php")
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
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.textContent = "➡️ Interlocuteur suivant";
      }
    });
}

// Appeler un pair
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

// Initialisation au chargement
window.addEventListener('load', () => {
  showMessage("Initialisation...");
  listCameras();

  // Configurer les événements
  if (btnNext) {
    btnNext.onclick = handleNextClick;
  }

  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      startCamera(e.target.value);
    });
  }

  // Nettoyage avant fermeture
  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    if (currentCall) {
      currentCall.close();
    }
    if (peer) {
      peer.destroy();
    }
  });
});