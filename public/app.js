// LegalShuffleCam • app.js (Version FINALE fonctionnelle)
// Solution validée pour la détection des caméras sur mobile + intégration complète

// 1. Éléments DOM (adaptés à ton HTML)
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const btnNext = document.getElementById('btnNext');
const btnMic = document.getElementById('btnMic');
const btnReport = document.getElementById('btnReport');
const reportTarget = document.getElementById('reportTarget');
const loaderRing = document.getElementById('loaderRing');

// 2. Variables globales
let currentStream = null;
let peer = null;
let currentCall = null;
let faceTracker = null;

// 3. Fonction pour afficher les messages dans la topBar
function showMessage(msg, isError = false) {
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
    loaderRing.style.display = isError ? 'none' : 'block';
  }
  console.log((isError ? "[ERREUR] " : "[INFO] ") + msg);
}

// 4. Fonction CORRIGÉE pour détecter les caméras (solution validée)
async function detectCameras() {
  showMessage("Détection des caméras...");

  try {
    // Étape 1: Déclencher les permissions avec getUserMedia()
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }, // Caméra arrière par défaut
      audio: false
    });
    tempStream.getTracks().forEach(track => track.stop());
    showMessage("Permissions activées ✅");

    // Étape 2: Lister TOUS les périphériques
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');

    showMessage(`${cameras.length} caméra(s) détectée(s)`);

    // Étape 3: Remplir le sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label ||
                          (index === 0 ? 'Caméra arrière' : 'Caméra avant');
        cameraSelect.appendChild(option);
      });
    }

    // Étape 4: Démarrer avec la première caméra
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

// 5. Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    showMessage("Activation de la caméra...");

    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : true,
        facingMode: 'environment', // Priorité à la caméra arrière
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    localVideo.srcObject = stream;
    showMessage("Caméra active ✅");

    // Initialiser le suivi de visage
    if (typeof initFaceVisible === 'function') {
      initFaceVisible(localVideo);
    }

    // Initialiser PeerJS
    initPeerJS(stream);

    // Activer le bouton "Interlocuteur suivant"
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }

  } catch (error) {
    showMessage(`Erreur caméra: ${error.message}`, true);
    console.error("Erreur caméra:", error);

    // Solution de secours
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
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

// 6. Initialisation de PeerJS
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

// 7. Enregistrement du peer ID
function registerPeer(peerId) {
  fetch("/api/register-peer", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `peerId=${encodeURIComponent(peerId)}`
  })
  .catch(err => {
    console.error("Erreur enregistrement peer:", err);
  });
}

// 8. Gestion des appels entrants
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

// 9. Gestion du bouton "Interlocuteur suivant"
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

// 10. Appeler un pair
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

// 11. Initialisation au chargement
window.addEventListener('load', () => {
  showMessage("Initialisation...");

  // Bouton pour déclencher manuellement (obligatoire sur mobile)
  const startButton = document.createElement('button');
  startButton.textContent = "Activer la caméra";
  startButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    background: #2563eb;
    color: white;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(startButton);

  startButton.addEventListener('click', () => {
    detectCameras();

    // Gestion du changement de caméra
    if (cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }
        startCamera(e.target.value);
      });
    }
  });

  // Gestion du micro
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