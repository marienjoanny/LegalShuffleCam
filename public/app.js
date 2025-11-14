// LegalShuffleCam • app.js
// Version finale optimisée avec gestion améliorée des états de connexion

// Éléments DOM
let currentStream = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const btnNext = document.getElementById('btnNext');

// Variables globales
window.faceVisible = true;
let isWebRTCInitialized = false;
let socketRetryCount = 0;
const MAX_SOCKET_RETRIES = 5;
const SOCKET_RETRY_DELAY = 1000; // 1 seconde entre les tentatives

// États possibles
const States = {
  CAMERA_INIT: "Initialisation de la caméra...",
  CAMERA_READY: "Caméra prête",
  SOCKET_CONNECTING: "Connexion au serveur...",
  SOCKET_READY: "Serveur connecté",
  WEBRTC_INIT: "Initialisation WebRTC...",
  WEBRTC_READY: "Prêt pour les appels",
  ERROR: "Erreur"
};

// Fonction pour mettre à jour la barre supérieure et le bouton
function updateUI(state, message = null) {
  if (!topBar) return;

  let fullMessage = message || state;
  topBar.textContent = fullMessage;

  if (btnNext) {
    switch(state) {
      case States.CAMERA_READY:
      case States.SOCKET_CONNECTING:
        btnNext.disabled = true;
        btnNext.textContent = "⏳ En attente du serveur...";
        break;
      case States.WEBRTC_READY:
        btnNext.disabled = false;
        btnNext.textContent = "➡️ Interlocuteur suivant";
        break;
      default:
        btnNext.disabled = true;
        btnNext.textContent = "⏳ Préparation...";
    }
  }
}

// Fonction pour lister les caméras disponibles
async function listCameras() {
  try {
    updateUI(States.CAMERA_INIT, "🔍 Recherche des caméras disponibles...");

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
      updateUI(States.ERROR, "❌ Aucune caméra détectée.");
      console.warn('Aucune caméra détectée sur ce périphérique.');
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateUI(States.ERROR, "❌ Erreur lors de la détection des caméras.");
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateUI(States.CAMERA_INIT, "📷 Demande d'accès à la caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      console.log('[APP] Flux vidéo local affiché avec succès.');
    }

    updateUI(States.CAMERA_READY, "✅ Caméra active.");
    checkSocketConnection();

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    let userMessage = "❌ Erreur caméra.";
    if (err.name === 'NotAllowedError') {
      userMessage = "❌ Accès caméra refusé. Autorisez l'accès dans les paramètres du navigateur.";
    } else if (err.name === 'NotFoundError') {
      userMessage = "❌ Aucune caméra trouvée.";
    }
    updateUI(States.ERROR, userMessage);
    currentStream = null;
  }
}

// Vérification de la connexion socket
function checkSocketConnection() {
  socketRetryCount = 0;
  attemptSocketConnection();
}

// Tentative de connexion socket
function attemptSocketConnection() {
  socketRetryCount++;

  // Vérifier si le socket est déjà connecté
  if (typeof window.socket !== 'undefined' && window.socket.connected) {
    console.log('[Socket] Déjà connecté');
    initWebRTC(currentStream);
    return;
  }

  // Trop de tentatives, abandonner
  if (socketRetryCount > MAX_SOCKET_RETRIES) {
    updateUI(States.ERROR, "❌ Impossible de se connecter au serveur après plusieurs tentatives.");
    console.error('[Socket] Échec de connexion après plusieurs tentatives');
    return;
  }

  updateUI(States.SOCKET_CONNECTING, `⏳ Connexion au serveur (${socketRetryCount}/${MAX_SOCKET_RETRIES})...`);

  // Si le socket n'est pas défini, attendre qu'il le soit
  if (typeof window.socket === 'undefined') {
    console.warn('[Socket] Non initialisé. Attente...');
    setTimeout(attemptSocketConnection, SOCKET_RETRY_DELAY);
    return;
  }

  // Configurer les écouteurs socket
  window.socket.once('connect', () => {
    console.log('[Socket] Connecté avec succès');
    updateUI(States.SOCKET_READY, "✅ Connecté au serveur.");
    initWebRTC(currentStream);
  });

  window.socket.once('connect_error', (err) => {
    console.error('[Socket] Erreur de connexion:', err);
    updateUI(States.ERROR, `⚠ Erreur de connexion (${err.message})`);
    setTimeout(attemptSocketConnection, SOCKET_RETRY_DELAY);
  });

  // Si le socket est déconnecté, essayer de le reconnecter
  if (window.socket.disconnected) {
    console.log('[Socket] Tentative de reconnexion...');
    window.socket.connect();
  }

  // Réessayer dans tous les cas
  setTimeout(attemptSocketConnection, SOCKET_RETRY_DELAY);
}

// Initialisation de WebRTC
function initWebRTC(stream) {
  if (!stream || isWebRTCInitialized) return;

  try {
    updateUI(States.WEBRTC_INIT, "🔧 Initialisation WebRTC...");

    window.socket.emit('request-turn-credentials', (credentials) => {
      if (!credentials) {
        console.error('[WebRTC] Identifiants TURN non reçus');
        updateUI(States.ERROR, "⚠ Erreur: identifiants serveur manquants");
        return;
      }

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

      if (typeof window.connectSocketAndWebRTC === 'function') {
        window.connectSocketAndWebRTC(stream, rtcConfig);
        isWebRTCInitialized = true;
        updateUI(States.WEBRTC_READY, "✅ Tout est prêt!");
      } else {
        console.error('[WebRTC] Fonction connectSocketAndWebRTC non définie');
        updateUI(States.ERROR, "⚠ Erreur: fonction WebRTC manquante");
      }
    });
  } catch (err) {
    console.error('[WebRTC] Erreur:', err);
    updateUI(States.ERROR, "⚠ Erreur d'initialisation WebRTC");
  }
}

// Fonction pour gérer le clic sur le bouton "Interlocuteur suivant"
function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
    isWebRTCInitialized = false;
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (currentStream && isWebRTCInitialized && window.socket?.connected) {
    updateUI(States.WEBRTC_INIT, "🔍 Recherche d'un partenaire...");
    window.socket.emit("ready-for-match");
  } else {
    let errorMessage = "❌ ";
    if (!currentStream) errorMessage += "Flux vidéo manquant";
    else if (!isWebRTCInitialized) errorMessage += "WebRTC non initialisé";
    else errorMessage += "Serveur déconnecté";

    console.error('[NextButton] ' + errorMessage);
    updateUI(States.ERROR, errorMessage);
  }
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

// Écouteurs d'événements
window.addEventListener('rtcError', (event) => {
  console.error("[WebRTC] Erreur:", event.detail.message);
  updateUI(States.ERROR, `⚠ ${event.detail.message}`);
  isWebRTCInitialized = false;
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[WebRTC] Déconnexion:", event.detail.message);
  updateUI(States.CAMERA_READY, "🔍 Prêt pour une nouvelle connexion.");
  isWebRTCInitialized = false;
});