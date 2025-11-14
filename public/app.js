// LegalShuffleCam • app.js
// Version ultra-simplifiée pour diagnostiquer le problème de caméra

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
    updateTopBar("🔍 Recherche des caméras disponibles...");

    // Vérification des permissions
    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
    console.log('Statut des permissions caméra:', permissionStatus.state);

    if (permissionStatus.state === 'denied') {
      updateTopBar("❌ Permission caméra refusée. Veuillez autoriser l'accès à la caméra.");
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    console.log('Périphériques vidéo trouvés:', videoInputs);

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
      console.warn('Aucune caméra détectée sur ce périphérique.');
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur lors de la détection des caméras.");
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    updateTopBar("📷 Demande d'accès à la caméra...");

    // Vérification de la disponibilité de l'API
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateTopBar("❌ API mediaDevices non disponible.");
      console.error('API mediaDevices non disponible');
      return;
    }

    // Vérification de l'élément vidéo
    if (!localVideo) {
      updateTopBar("❌ Élément vidéo local introuvable.");
      console.error('Élément localVideo introuvable');
      return;
    }

    console.log('Demande d\'accès à la caméra avec deviceId:', deviceId);

    // Options de base pour le test
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false // Désactivé pour simplifier le diagnostic
    };

    console.log('Contraintes utilisées:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    currentStream = stream;
    localVideo.srcObject = stream;

    console.log('Flux obtenu avec succès:', stream);
    updateTopBar("✅ Caméra active.");

    // Afficher les informations du flux
    if (stream.getVideoTracks().length > 0) {
      const track = stream.getVideoTracks()[0];
      console.log('Piste vidéo obtenue:', {
        id: track.id,
        kind: track.kind,
        label: track.label,
        readyState: track.readyState
      });
    }

  } catch (err) {
    console.error("Erreur détaillée lors de l'accès à la caméra:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    let userMessage = "❌ Erreur caméra.";
    if (err.name === 'NotAllowedError') {
      userMessage = "❌ Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.";
    } else if (err.name === 'NotFoundError') {
      userMessage = "❌ Aucune caméra trouvée.";
    } else if (err.name === 'NotReadableError') {
      userMessage = "❌ La caméra est déjà utilisée ou indisponible.";
    } else if (err.name === 'OverconstrainedError') {
      userMessage = "❌ Contraintes de caméra impossibles à satisfaire.";
    } else if (err.name === 'SecurityError') {
      userMessage = "❌ Accès refusé pour des raisons de sécurité (HTTPS requis).";
    }

    updateTopBar(userMessage);
    currentStream = null;
  }
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

// Initialisation au chargement de la page
window.addEventListener('load', () => {
  console.log('Page chargée, démarrage de la détection des caméras...');
  listCameras();

  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
  });
});