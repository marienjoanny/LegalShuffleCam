// LegalShuffleCam • app.js
// Version corrigée avec gestion améliorée des états

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
let isSocketConnected = false;
let turnCredentials = null;

// Fonction pour mettre à jour la barre supérieure
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

// Fonction pour mettre à jour l'état du bouton
function updateNextButtonState() {
  if (btnNext) {
    // Le bouton est activé uniquement si le flux local est disponible ET que WebRTC est initialisé
    const isReady = currentStream && isWebRTCInitialized;
    btnNext.disabled = !isReady;
    btnNext.textContent = isReady ? '➡️ Interlocuteur suivant' : '... Préparation WebRTC ...';
  }
}

// Fonction pour lister les caméras disponibles
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

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

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
      audio: true
    };

    console.log('Contraintes utilisées:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    currentStream = stream;
    localVideo.srcObject = stream;

    console.log('Flux obtenu avec succès:', stream);
    updateTopBar("✅ Caméra active. Initialisation WebRTC en cours...");

    if (stream.getVideoTracks().length > 0) {
      const track = stream.getVideoTracks()[0];
      console.log('Piste vidéo obtenue:', {
        id: track.id,
        kind: track.kind,
        label: track.label,
        readyState: track.readyState
      });
    }

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    // Initialiser WebRTC après confirmation de l'affichage de la caméra
    if (currentStream) {
      initWebRTC(currentStream);
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
    updateNextButtonState();

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
    }
    updateTopBar(userMessage);
    currentStream = null;
    updateNextButtonState();
  }
}

// Initialisation de WebRTC
function initWebRTC(stream) {
  if (!stream || isWebRTCInitialized) return;

  try {
    // Vérifier l'état du socket
    if (typeof window.socket !== 'undefined' && window.socket.connected) {
      isSocketConnected = true;
      console.log('[WebRTC] Socket connecté. Demande des identifiants TURN...');

      window.socket.emit('request-turn-credentials', (credentials) => {
        if (!credentials) {
          console.error('[WebRTC] Erreur : identifiants TURN non reçus.');
          updateTopBar("⚠ Erreur d'initialisation WebRTC (identifiants TURN manquant)");
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
          console.log('[WebRTC] Initialisation réussie');
          updateTopBar("✅ Caméra active. WebRTC prêt.");
          updateNextButtonState();
        } else {
          console.error('[WebRTC] Erreur : connectSocketAndWebRTC non défini.');
          updateTopBar("⚠ Erreur d'initialisation WebRTC (fonction manquante)");
        }
      });
    } else {
      console.warn('[WebRTC] Socket non connecté. Réessai dans 1s...');
      updateTopBar("⚠ En attente de connexion socket pour WebRTC...");
      setTimeout(() => initWebRTC(stream), 1000);
    }
  } catch (err) {
    console.error('[WebRTC] Erreur lors de l\'initialisation:', err);
    updateTopBar("⚠ Erreur d'initialisation WebRTC");
  }
}

// Fonction pour gérer le clic sur le bouton "Interlocuteur suivant"
function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
    isWebRTCInitialized = false;
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = '⏳ Connexion...';
  }

  if (currentStream && isWebRTCInitialized && typeof window.socket !== 'undefined' && window.socket.connected) {
    updateTopBar("🔍 Recherche d'un partenaire...");
    window.socket.emit("ready-for-match");
  } else {
    let errorMessage = "❌ ";
    if (!currentStream) {
      errorMessage += "Flux vidéo local manquant.";
    } else if (!isWebRTCInitialized) {
      errorMessage += "WebRTC non initialisé. Patientiez...";
    } else if (typeof window.socket === 'undefined' || !window.socket.connected) {
      errorMessage += "Socket non connecté.";
    }
    console.error('[NextButton] ' + errorMessage);
    updateTopBar(errorMessage);
    btnNext.disabled = true;
    setTimeout(updateNextButtonState, 2000);
  }
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

if (btnNext) {
  btnNext.onclick = handleNextClick;
}

// Écouteurs d'événements
window.addEventListener('rtcError', (event) => {
  console.error("[WebRTC] Erreur:", event.detail.message);
  if (topBar) {
    topBar.textContent = `⚠ ${event.detail.message}`;
  }
  isWebRTCInitialized = false;
  updateNextButtonState();
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[WebRTC] Déconnexion:", event.detail.message);
  if (topBar) {
    topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
  }
  isWebRTCInitialized = false;
  updateNextButtonState();
});

// Écouteur pour la connexion socket
if (typeof window.socket !== 'undefined') {
  window.socket.on('connect', () => {
    isSocketConnected = true;
    console.log('[Socket] Connecté');
    if (currentStream && !isWebRTCInitialized) {
      initWebRTC(currentStream);
    }
  });

  window.socket.on('disconnect', () => {
    isSocketConnected = false;
    isWebRTCInitialized = false;
    console.log('[Socket] Déconnecté');
    updateNextButtonState();
  });
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