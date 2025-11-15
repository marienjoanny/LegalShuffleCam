// LegalShuffleCam • app.js
// Version PeerJS avec détection des caméras fonctionnelle

// Éléments DOM
let currentStream = null;
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const topBar = document.getElementById('topBar');
const btnNext = document.getElementById('btnNext');

// Variables PeerJS
let peer = null;
let currentCall = null;

// Fonction pour mettre à jour la barre supérieure et logger
function updateStatus(message, isError = false) {
  const prefix = isError ? "❌ " : "📡 ";
  if (topBar) topBar.textContent = prefix + message;
  console.log(prefix + message);
}

// 1. Détection des caméras (version ultra-stable)
async function detectCameras() {
  try {
    updateStatus("Détection des caméras...");

    // Vérifier les permissions d'abord
    const permission = await navigator.permissions.query({ name: 'camera' });
    if (permission.state === 'denied') {
      updateStatus("Accès caméra refusé. Autorisez dans les paramètres du navigateur.", true);
      return;
    }

    // Obtenir la liste des caméras
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
      updateStatus("Caméras détectées");
      startCamera(videoInputs[0].deviceId);
    } else {
      updateStatus("Aucune caméra détectée", true);
    }
  } catch (err) {
    console.error("Erreur détection caméras:", err);
    updateStatus("Erreur de détection des caméras", true);
  }
}

// 2. Démarrage de la caméra (version robuste)
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateStatus("Accès à la caméra...");

    // Contraintes minimales pour maximiser la compatibilité
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false  // Désactivé pour simplifier
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;

    if (localVideo) {
      localVideo.srcObject = stream;
      updateStatus("Caméra active ✅");
    }

    // Activer le bouton
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }

    // Initialiser PeerJS si ce n'est pas déjà fait
    if (!peer) {
      initPeerJS();
    }

  } catch (err) {
    console.error("Erreur caméra:", err);
    updateStatus("Erreur caméra: " + err.message, true);

    // Tentative de secours
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      updateStatus("Caméra active (mode compatible) ✅");
    } catch (fallbackErr) {
      console.error("Erreur mode compatible:", fallbackErr);
      updateStatus("Impossible d'accéder à la caméra", true);
    }
  }
}

// 3. Initialisation de PeerJS
function initPeerJS() {
  if (!currentStream) {
    updateStatus("Impossible d'initialiser PeerJS sans flux vidéo", true);
    return;
  }

  updateStatus("Initialisation de PeerJS...");

  peer = new Peer(undefined, {
    host: 'legalshufflecam.ovh',
    port: 443,
    path: '/peerjs',
    secure: true,
    debug: 2  // Niveau de log élevé pour le débogage
  });

  peer.on('open', id => {
    updateStatus(`PeerJS connecté (ID: ${id})`);
    registerPeer(id);
  });

  peer.on('error', err => {
    console.error("Erreur PeerJS:", err);
    updateStatus(`Erreur PeerJS: ${err.message}`, true);

    // Réessayer après un délai
    setTimeout(() => {
      if (!peer || peer.disconnected) {
        initPeerJS();
      }
    }, 5000);
  });

  peer.on('call', call => {
    updateStatus(`Appel entrant de ${call.peer}`);
    handleIncomingCall(call);
  });

  peer.on('connection', conn => {
    conn.on('open', () => {
      updateStatus(`Connexion data établie avec ${conn.peer}`);
    });
  });
}

// 4. Enregistrement du peer ID
function registerPeer(peerId) {
  fetch("register-peer.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `peerId=${encodeURIComponent(peerId)}`
  })
  .then(res => res.text())
  .then(text => {
    if (text !== "OK") {
      updateStatus(`Erreur enregistrement peer: ${text}`, true);
    }
  })
  .catch(err => {
    console.error("Erreur enregistrement:", err);
    updateStatus("Erreur enregistrement peer", true);
  });
}

// 5. Gestion des appels entrants
function handleIncomingCall(call) {
  if (!currentStream) {
    call.close();
    updateStatus("Appel rejeté: pas de flux vidéo", true);
    return;
  }

  call.answer(currentStream);
  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    updateStatus("Flux distant reçu ✅");
  });

  call.on('close', () => {
    remoteVideo.srcObject = null;
    updateStatus("Appel terminé");
  });

  call.on('error', err => {
    console.error("Erreur appel:", err);
    updateStatus(`Erreur appel: ${err.message}`, true);
  });

  currentCall = call;
}

// 6. Gestion du bouton "Interlocuteur suivant"
function handleNextClick() {
  if (!peer || !peer.id || !currentStream) {
    updateStatus("PeerJS ou caméra non prêt", true);
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
        updateStatus(`Connexion à ${data.partnerId}...`);
        callPeer(data.partnerId);
      } else {
        updateStatus("Aucun partenaire disponible", true);
      }
    })
    .catch(err => {
      console.error("Erreur recherche partenaire:", err);
      updateStatus("Erreur recherche partenaire", true);
    })
    .finally(() => {
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.textContent = "➡️ Interlocuteur suivant";
      }
    });
}

// 7. Appeler un pair
function callPeer(partnerId) {
  if (!currentStream) {
    updateStatus("Impossible d'appeler sans flux vidéo", true);
    return;
  }

  const call = peer.call(partnerId, currentStream);

  call.on('stream', remoteStream => {
    remoteVideo.srcObject = remoteStream;
    updateStatus("Flux distant reçu ✅");
  });

  call.on('close', () => {
    remoteVideo.srcObject = null;
    updateStatus("Appel terminé");
  });

  call.on('error', err => {
    console.error("Erreur appel:", err);
    updateStatus(`Erreur appel: ${err.message}`, true);
  });

  currentCall = call;
}

// 8. Initialisation au chargement
window.addEventListener('load', () => {
  // Détecter les caméras
  detectCameras();

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