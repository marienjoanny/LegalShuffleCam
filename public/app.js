// LegalShuffleCam • app.js
// Version finale basée sur ta version fonctionnelle + WebRTC isolé

// Éléments DOM
let currentStream = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const btnNext = document.getElementById('btnNext');

// Variables globales pour WebRTC (isolées)
let isWebRTCInitialized = false;
let turnCredentials = null;

// Fonction pour mettre à jour la barre supérieure
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

// Fonction pour lister les caméras disponibles (inchangée)
async function listCameras() {
  try {
    updateTopBar("🔍 Recherche des caméras disponibles...");

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

// Fonction pour démarrer une caméra (inchangée)
async function startCamera(deviceId) {
  try {
    updateTopBar("📷 Demande d'accès à la caméra...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateTopBar("❌ API mediaDevices non disponible.");
      console.error('API mediaDevices non disponible');
      return;
    }

    if (!localVideo) {
      updateTopBar("❌ Élément vidéo local introuvable.");
      console.error('Élément localVideo introuvable');
      return;
    }

    console.log('Demande d\'accès à la caméra avec deviceId:', deviceId);

    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    };

    console.log('Contraintes utilisées:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    currentStream = stream;
    localVideo.srcObject = stream;

    console.log('Flux obtenu avec succès:', stream);
    updateTopBar("✅ Caméra active.");

    if (stream.getVideoTracks().length > 0) {
      const track = stream.getVideoTracks()[0];
      console.log('Piste vidéo obtenue:', {
        id: track.id,
        kind: track.kind,
        label: track.label,
        readyState: track.readyState
      });
    }

    // Initialiser WebRTC uniquement après confirmation que la caméra fonctionne
    if (currentStream) {
      initWebRTCSafely(currentStream);
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

// Initialisation sécurisée de WebRTC (complètement isolée)
function initWebRTCSafely(stream) {
  // Vérifier que tout est prêt avant de continuer
  if (!stream || !window.socket || !window.socket.connected) {
    console.log('WebRTC: Conditions non remplies pour l\'initialisation. Réessai plus tard.');
    setTimeout(() => initWebRTCSafely(stream), 2000);
    return;
  }

  try {
    console.log('Initialisation sécurisée de WebRTC...');

    // Demander les identifiants TURN
    window.socket.emit('request-turn-credentials', (credentials) => {
      if (!credentials) {
        console.error('WebRTC: Identifiants TURN non reçus');
        return;
      }

      // Configuration WebRTC
      const rtcConfig = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: `turn:legalshufflecam.ovh:3478?transport=udp`,
            username: credentials.username,
            credential: credentials.credential,
            credentialType: 'password'
          },
          {
            urls: `turns:legalshufflecam.ovh:5349`,
            username: credentials.username,
            credential: credentials.credential,
            credentialType: 'password'
          }
        ],
        iceTransportPolicy: 'all',
        sdpSemantics: 'unified-plan'
      };

      // Initialiser WebRTC uniquement si la fonction existe
      if (typeof window.connectSocketAndWebRTC === 'function') {
        window.connectSocketAndWebRTC(stream, rtcConfig);
        isWebRTCInitialized = true;
        console.log('WebRTC initialisé avec succès');
      } else {
        console.error('WebRTC: Fonction connectSocketAndWebRTC non définie');
      }
    });
  } catch (err) {
    console.error('Erreur lors de l\'initialisation WebRTC:', err);
  }
}

// Fonction pour gérer le clic sur le bouton "Interlocuteur suivant"
function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = '⏳ Connexion...';
  }

  if (currentStream && typeof window.socket !== 'undefined' && window.socket.connected) {
    updateTopBar("🔍 Recherche d'un partenaire...");
    window.socket.emit("ready-for-match");
  } else {
    console.error('Erreur: currentStream est null ou socket non connecté');
    updateTopBar("❌ Connexion perdue ou flux manquant.");
  }

  setTimeout(() => {
    if (btnNext) {
      btnNext.disabled = !currentStream;
      btnNext.textContent = currentStream ? '➡️ Interlocuteur suivant' : '... Préparation ...';
    }
  }, 1500);
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

if (btnNext) {
  btnNext.onclick = handleNextClick;
}

// Initialisation au chargement de la page
window.addEventListener('load', () => {
  console.log('Page chargée, démarrage de la détection des caméras...');
  listCameras();

  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    if (typeof window.disconnectWebRTC === 'function') {
      window.disconnectWebRTC();
    }
  });
});

// Écouteurs d'événements WebRTC (isolés)
if (typeof window.addEventListener === 'function') {
  window.addEventListener('rtcError', (event) => {
    console.error("Erreur WebRTC:", event.detail.message);
    if (topBar) {
      topBar.textContent = `⚠ ${event.detail.message}`;
    }
  });

  window.addEventListener('rtcDisconnected', (event) => {
    console.log("Déconnexion WebRTC:", event.detail.message);
    if (topBar) {
      topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
    }
    isWebRTCInitialized = false;
  });
}