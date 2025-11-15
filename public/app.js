// LegalShuffleCam • app.js
// Version ultra-minimaliste pour la détection des caméras avec PeerJS

// 1. Éléments DOM strictement nécessaires
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');

// 2. Fonction pour afficher les messages
function showMessage(msg, isError = false) {
  topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
}

// 3. Détection des caméras (version la plus simple possible)
async function detectCameras() {
  try {
    showMessage("Détection des caméras...");

    // Vérification basique des permissions
    const permission = await navigator.permissions.query({ name: 'camera' });
    if (permission.state === 'denied') {
      showMessage("Accès caméra refusé. Autorisez dans les paramètres.", true);
      return;
    }

    // Liste des périphériques vidéo
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');

    showMessage(`${cameras.length} caméra(s) détectée(s)`);

    // Remplissage du sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, i) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Caméra ${i+1}`;
        cameraSelect.appendChild(option);
      });
    }

    // Démarrer avec la première caméra si disponible
    if (cameras.length > 0) {
      startCamera(cameras[0].deviceId);
    }

  } catch (err) {
    showMessage(`Erreur: ${err.message}`, true);
  }
}

// 4. Démarrage d'une caméra
async function startCamera(deviceId) {
  try {
    showMessage("Activation de la caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false
    });

    localVideo.srcObject = stream;
    showMessage("Caméra active ✅");

    // Initialiser PeerJS uniquement après confirmation que la caméra fonctionne
    initPeerJS(stream);

  } catch (err) {
    showMessage(`Erreur caméra: ${err.message}`, true);
  }
}

// 5. Initialisation de PeerJS (version minimale)
function initPeerJS(stream) {
  const peer = new Peer(undefined, {
    host: 'legalshufflecam.ovh',
    port: 443,
    path: '/peerjs',
    secure: true
  });

  peer.on('open', id => {
    showMessage(`PeerJS connecté (ID: ${id})`);
  });

  peer.on('error', err => {
    showMessage(`Erreur PeerJS: ${err.message}`, true);
  });
}

// 6. Initialisation au chargement
window.addEventListener('load', () => {
  detectCameras();

  // Changement de caméra
  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      startCamera(e.target.value);
    });
  }
});