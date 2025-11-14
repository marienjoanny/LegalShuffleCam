// LegalShuffleCam • app.js
// Version corrigée avec liste des caméras + affichage + WebRTC

// Éléments DOM
let currentStream = null;
let peerConnection = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const btnNext = document.getElementById('btnNext');

// Variables globales
window.faceVisible = true;
let isWebRTCInitialized = false;
let turnCredentials = null;

// Fonctions utilitaires
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  if (btnNext) {
    btnNext.disabled = !currentStream;
    btnNext.textContent = currentStream ? '➡️ Interlocuteur suivant' : '... Préparation ...';
  }
}

// Gestion des caméras
async function listCameras() {
  try {
    updateTopBar("🔍 Recherche des caméras disponibles...");

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    console.log('Caméras disponibles:', videoInputs);

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
      updateNextButtonState();
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur lors de la détection des caméras.");
    updateNextButtonState();
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Demande d'accès à la caméra...");

    // Demander l'accès à la caméra
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
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
      return;
    }

    // Initialiser la détection de visage si disponible
    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    // Initialiser WebRTC après confirmation de l'affichage de la caméra
    if (currentStream) {
      safeInitWebRTC(currentStream);
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
    updateNextButtonState();

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    let userMessage = "❌ Caméra refusée ou indisponible.";
    if (err.name === 'NotAllowedError') {
      userMessage = "❌ Accès caméra refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.";
    } else if (err.name === 'NotFoundError') {
      userMessage = "❌ Aucune caméra trouvée.";
    }
    updateTopBar(userMessage);
    currentStream = null;
    updateNextButtonState();
  }
}

// Initialisation sécurisée de WebRTC
function safeInitWebRTC(stream) {
  if (!stream || isWebRTCInitialized) return;

  try {
    if (typeof socket !== 'undefined' && socket.connected) {
      console.log('[APP] Initialisation sécurisée de WebRTC...');

      socket.emit('request-turn-credentials', (credentials) => {
        if (!credentials) {
          console.error('[APP] Erreur : identifiants TURN non reçus.');
          return;
        }

        turnCredentials = credentials;
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
          console.log('[APP] WebRTC initialisé avec succès.');
        }
      });
    } else {
      console.warn('[APP] Socket non connecté. Réessai dans 1s...');
      setTimeout(() => safeInitWebRTC(stream), 1000);
    }
  } catch (err) {
    console.error('[APP] Erreur lors de l\'initialisation WebRTC :', err);
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

  if (currentStream && typeof socket !== 'undefined' && socket.connected) {
    updateTopBar("🔍 Recherche d’un partenaire...");
    socket.emit("ready-for-match");
  } else {
    console.error('[APP] Erreur : currentStream est null ou socket non connecté.');
    updateTopBar("❌ Connexion perdue ou flux manquant.");
  }

  setTimeout(updateNextButtonState, 1500);
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => {
    console.log('Changement de caméra demandé:', e.target.value);
    startCamera(e.target.value);
  });
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
  isWebRTCInitialized = false;
  updateNextButtonState();
});