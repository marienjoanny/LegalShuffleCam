// LegalShuffleCam • app.js
// Version corrigée avec détection des caméras et logs dans topBar

// Éléments DOM existants
let currentStream = null;
let peerConnection = null;
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');
const reportSelect = document.getElementById('reportTarget');
const reportBtn = document.getElementById('btnReport');

// Variables globales existantes
window.faceVisible = true;
window.trackerInitialized = false;
const recentPartners = [];
let turnCredentials = null;

// Fonction pour ajouter des logs dans la topBar avec timestamp
function logToTopBar(message, isError = false) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = isError ? "❌ [" + timestamp + "] " : "📡 [" + timestamp + "] ";
  topBar.textContent = prefix + message;
}

// Fonction pour lister les caméras avec logs détaillés
async function listCameras() {
  try {
    logToTopBar("Détection des caméras en cours...");

    // Vérification des permissions
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      logToTopBar(`Permissions caméra: ${permissionStatus.state}`);
      if (permissionStatus.state === 'denied') {
        logToTopBar("Accès caméra refusé. Autorisez dans les paramètres du navigateur.", true);
        return;
      }
    } catch (permErr) {
      logToTopBar("Impossible de vérifier les permissions: " + permErr.message, true);
    }

    // Détection des périphériques
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    logToTopBar(`Nombre de caméras détectées: ${videoInputs.length}`);

    // Remplissage du sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      videoInputs.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
        logToTopBar(`Caméra ${index + 1}: ${device.label || 'Non nommée'} (ID: ${device.deviceId.substring(0, 8)}...)`);
      });
    }

    if (videoInputs.length > 0) {
      logToTopBar(`✅ ${videoInputs.length} caméra(s) prête(s)`);
      startCamera(videoInputs[0].deviceId);
    } else {
      logToTopBar("Aucune caméra détectée", true);
    }
  } catch (err) {
    logToTopBar(`Erreur détection caméras: ${err.name || 'Erreur'}: ${err.message}`, true);
  }
}

// Fonction pour démarrer une caméra avec logs
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    logToTopBar(`Accès à la caméra ${deviceId ? deviceId.substring(0, 8) + "..." : 'par défaut'}...`);

    // Contraintes minimales
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true
    };

    logToTopBar(`Contraintes: ${JSON.stringify(constraints)}`);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;

    if (localVideo) {
      localVideo.srcObject = stream;
      logToTopBar("Caméra active ✅");

      // Afficher les détails du flux
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        logToTopBar(`Résolution: ${settings.width || '?'}x${settings.height || '?'}`);
      }
    }

    // Initialiser WebRTC si le socket est prêt
    if (typeof socket !== 'undefined' && socket.connected) {
      initiateWebRTC(currentStream);
    } else {
      logToTopBar("Socket non connecté. WebRTC sera initialisé plus tard.");
      // Écouter la connexion socket pour initialiser WebRTC plus tard
      if (typeof socket !== 'undefined') {
        socket.once('connect', () => {
          logToTopBar("Socket connecté. Initialisation WebRTC...");
          initiateWebRTC(currentStream);
        });
      }
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
    updateNextButtonState();

  } catch (err) {
    logToTopBar(`Erreur caméra: ${err.name || 'Erreur'}: ${err.message}`, true);

    // Tentative de secours
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      logToTopBar("Caméra active (mode secours) ✅");

      // Réessayer WebRTC si le socket est connecté
      if (typeof socket !== 'undefined' && socket.connected) {
        initiateWebRTC(fallbackStream);
      }
    } catch (fallbackErr) {
      logToTopBar(`Erreur mode secours: ${fallbackErr.name || 'Erreur'}: ${fallbackErr.message}`, true);
    }

    updateNextButtonState();
  }
}

// Fonction pour mettre à jour l'état du bouton
function updateNextButtonState() {
  if (btnNext) {
    // Le bouton est activé uniquement si le flux local est disponible
    btnNext.disabled = !currentStream;
    btnNext.textContent = currentStream ? '➡️ Interlocuteur suivant' : '... Préparation ...';
    btnNext.onclick = handleNextClick;
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

  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected && currentStream) {
      logToTopBar("Recherche d'un partenaire...");

      const startMatching = () => {
        logToTopBar("Envoi de ready-for-match...");
        socket.emit("ready-for-match");
      };

      if (turnCredentials) {
        startMatching();
      } else {
        socket.emit('request-turn-credentials', (credentials) => {
          turnCredentials = credentials;
          logToTopBar("Identifiants TURN reçus");
          startMatching();
        });
      }
    } else {
      let errorMsg = "Conditions non remplies: ";
      if (!currentStream) errorMsg += "Pas de flux vidéo";
      else if (!socket?.connected) errorMsg += "Socket non connecté";
      logToTopBar(errorMsg, true);
      updateNextButtonState();
    }
  }, 1500);
}

// Fonction d'initialisation WebRTC (inchangée de ta version originale)
function initiateWebRTC(stream) {
  if (typeof window.connectSocketAndWebRTC !== "function") {
    logToTopBar("Erreur: connectSocketAndWebRTC non défini", true);
    return;
  }

  const setupRTC = (credentials) => {
    window.connectSocketAndWebRTC(stream, credentials);
    logToTopBar("WebRTC initialisé avec succès");
  };

  if (turnCredentials) {
    logToTopBar("Utilisation des identifiants TURN existants");
    setupRTC(turnCredentials);
    return;
  }

  logToTopBar("Demande des identifiants TURN...");
  socket.emit('request-turn-credentials', (credentials) => {
    turnCredentials = credentials;
    logToTopBar("Identifiants TURN reçus");
    setupRTC(credentials);
  });
}

// [Le reste de ton code existant pour les signalements, etc.]
// (Garde toutes tes autres fonctions existantes)

// Initialisation au chargement
window.addEventListener('load', () => {
  logToTopBar("Initialisation de l'application...");
  listCameras();

  // Écouteurs d'événements existants
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

  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    if (typeof window.disconnectWebRTC === 'function') {
      window.disconnectWebRTC();
    }
  });
});