// LegalShuffleCam • app.js
// Version minimaliste pour l'affichage de la caméra locale

// Éléments DOM
let currentStream = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const cameraSelect = document.getElementById('cameraSelect');

// Fonction pour mettre à jour la barre supérieure
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

// Fonction pour lister les caméras disponibles
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
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur caméra. Vérifiez les permissions.");
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Demande de permissions caméra...");

    // Demander l'accès à la caméra
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    });

    // Stocker le flux et l'afficher
    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      console.log('[APP] Flux vidéo local affiché avec succès.');
      updateTopBar("✅ Caméra active.");
    } else {
      console.error('[APP] Erreur : élément localVideo introuvable dans le DOM.');
      updateTopBar("❌ Élément vidéo introuvable.");
    }

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    updateTopBar("❌ Caméra refusée ou indisponible. Rechargez après avoir autorisé.");
  }
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

// Initialisation au chargement de la page
window.addEventListener('load', () => {
  listCameras();

  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
  });
});