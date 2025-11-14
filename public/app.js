// LegalShuffleCam • app.js
// Gestion des flux vidéo, des interactions utilisateur et des appels WebRTC

// Éléments DOM
let currentStream = null;
let peerConnection = null;
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');

// Variables globales
window.faceVisible = true;
const recentPartners = [];
let turnCredentials = null;
let isWebRTCInitialized = false;

// Configuration WebRTC de base (sera mise à jour dynamiquement)
let rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  sdpSemantics: 'unified-plan'
};

// Fonctions utilitaires
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  if (btnNext) {
    const isReady = currentStream && window.faceVisible;
    btnNext.disabled = !isReady;
    btnNext.textContent = isReady ? '➡️ Interlocuteur suivant' : '... Préparation ...';
    btnNext.onclick = handleNextClick;
  }
}

function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = '⏳ Connexion...';
  }

  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected && currentStream) {
      updateTopBar("🔍 Recherche d’un partenaire...");
      socket.emit("ready-for-match");
    } else {
      console.error('[APP] Erreur : currentStream est null ou socket non connecté.');
      updateTopBar("❌ Connexion perdue ou flux manquant. Rechargez la page.");
    }
    updateNextButtonState();
  }, 1500);
}

// Met à jour la configuration RTC avec les identifiants TURN
function updateRTCConfig(credentials) {
  rtcConfig.iceServers = [
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
  ];
  console.log('[APP] Configuration RTC mise à jour avec les nouveaux identifiants TURN.');
}

// Gestion des caméras
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

async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Demande de permissions caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      console.log('[APP] Flux vidéo local affiché avec succès.');
      updateTopBar("✅ Caméra active.");
    } else {
      console.error('[APP] Erreur : élément localVideo introuvable dans le DOM.');
      updateTopBar("❌ Élément vidéo introuvable.");
    }

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    if (currentStream) {
      checkSocketAndInit(currentStream);
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    updateTopBar("❌ Caméra refusée ou indisponible. Rechargez après avoir autorisé.");
    currentStream = null;
    isWebRTCInitialized = false;
    updateNextButtonState();
  }
}

/**
 * Vérifie l'état du socket et initialise WebRTC/TURN.
 */
function checkSocketAndInit(stream) {
  if (typeof socket !== 'undefined' && socket.connected) {
    initiateWebRTC(stream);
  } else if (typeof socket === 'undefined') {
    console.warn("[APP] Socket.IO non défini. Retentative d'initialisation dans 500ms...");
    updateTopBar("🔌 Connexion Socket...");
    setTimeout(() => checkSocketAndInit(stream), 500);
  } else {
    console.log("[APP] Socket défini mais déconnecté. En attente...");
    updateTopBar("🔌 Connexion Socket...");
    socket.once('connect', () => {
      console.log("[APP] Socket connecté. Démarrage de WebRTC.");
      initiateWebRTC(stream);
    });
  }
}

// Nouvelle fonction d'initialisation WebRTC
function initiateWebRTC(stream) {
  if (isWebRTCInitialized) {
    console.log('[APP] WebRTC déjà initialisé, skipping credential request.');
    return;
  }

  if (typeof window.connectSocketAndWebRTC !== "function") {
    console.error('[APP] Erreur : connectSocketAndWebRTC non défini (rtc-core.js).');
    return;
  }

  const setupRTC = (credentials) => {
    turnCredentials = credentials;
    updateRTCConfig(credentials);
    isWebRTCInitialized = true;

    window.connectSocketAndWebRTC(stream, rtcConfig);

    if (typeof window.initSocketAndListeners === 'function') {
      window.initSocketAndListeners();
    } else {
      console.error('[APP] Erreur : initSocketAndListeners non défini (listener.js).');
    }
    updateNextButtonState();
    updateTopBar("Détection de visage...");
  };

  console.log('[APP] Demande initiale des identifiants TURN au serveur...');
  socket.emit('request-turn-credentials', (credentials) => {
    console.log('[APP] Identifiants TURN reçus à l\'initialisation.');
    setupRTC(credentials);
  });
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

if (btnSpeaker && remoteVideo) {
  btnSpeaker.addEventListener('click', () => {
    if (remoteVideo) {
      remoteVideo.muted = !remoteVideo.muted;
      btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
    }
  });
}

if (btnNext) {
  updateNextButtonState();
}

// Écouteurs d'événements
window.addEventListener('faceVisibilityChanged', updateNextButtonState);

window.addEventListener('rtcError', (event) => {
  console.error("[APP] Erreur WebRTC :", event.detail.message);
  if (event.detail.error) {
    console.trace("[APP] Trace de l'erreur :", event.detail.error);
  }
  if (topBar) {
    topBar.textContent = `⚠ ${event.detail.message}`;
  }
  updateNextButtonState();
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[APP] Déconnexion WebRTC :", event.detail.message);
  if (topBar) {
    topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
  }
  updateNextButtonState();
});

// Initialisation au chargement de la page
window.addEventListener('load', () => {
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