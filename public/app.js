// LegalShuffleCam • app.js (Version FINALE fonctionnelle)
// Solution validée pour la détection des caméras sur mobile

// 1. Éléments DOM nécessaires
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');
const btnNext = document.getElementById('btnNext');
const remoteVideo = document.getElementById('remoteVideo');

// 2. Variables globales
let currentStream = null;
let peer = null;
let currentCall = null;

// 3. Fonction pour afficher les messages
function showMessage(msg, isError = false) {
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
    console.log((isError ? "[ERREUR] " : "[INFO] ") + msg);
  }
}

// 4. Fonction CORRIGÉE pour détecter les caméras (solution validée)
async function detectCameras() {
  showMessage("Détection des caméras...");

  try {
    // Étape 1: Déclencher les permissions avec getUserMedia()
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
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
        option.textContent = camera.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    // Étape 4: Démarrer avec la première caméra
    if (cameras.length > 0) {
      await startCamera(cameras[0].deviceId);
    }

  } catch (error) {
    showMessage(`Erreur: ${error.message}`, true);
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

    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      showMessage("Caméra active ✅");
    }

    // Initialiser PeerJS
    initPeerJS(stream);

  } catch (error) {
    showMessage(`Erreur caméra: ${error.message}`, true);
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
  });

  peer.on('error', err => {
    showMessage(`Erreur PeerJS: ${err.message}`, true);
  });

  peer.on('call', call => {
    handleIncomingCall(call);
  });
}

// 7. Gestion des appels entrants
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

// 8. Gestion du bouton "Interlocuteur suivant"
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

  // Obtenir un partenaire (à adapter selon ton backend)
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

// 9. Appeler un pair
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

// 10. Initialisation au chargement
window.addEventListener('load', () => {
  showMessage("Initialisation...");

  // Bouton pour déclencher manuellement (obligatoire sur mobile)
  const startButton = document.createElement('button');
  startButton.textContent = "Activer la caméra";
  startButton.style.cssText = `
    padding: 12px 20px;
    margin: 10px 0;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
  `;
  document.body.prepend(startButton);

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