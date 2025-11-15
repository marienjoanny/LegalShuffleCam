// LegalShuffleCam • app.js
// Version ultra-stable avec caméra fonctionnelle + WebRTC progressif

// 1. Variables de base (seulement ce qui est nécessaire pour la caméra)
let currentStream = null;
const localVideo = document.getElementById('localVideo');
const cameraSelect = document.getElementById('cameraSelect');
const topBar = document.getElementById('topBar');
const btnNext = document.getElementById('btnNext');

// 2. Fonction utilitaire minimale pour la caméra
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

// 3. Fonction pour lister les caméras (version ultra-simple)
async function listCameras() {
  try {
    updateTopBar("🔍 Recherche des caméras...");

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
      startCamera(videoInputs[0].deviceId);
    } else {
      updateTopBar("❌ Aucune caméra détectée");
    }
  } catch (err) {
    console.error("Erreur caméra:", err);
    updateTopBar("❌ Erreur de détection des caméras");
  }
}

// 4. Fonction pour démarrer une caméra (version ultra-stable)
async function startCamera(deviceId) {
  try {
    // Arrêter le flux actuel s'il existe
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Accès à la caméra...");

    // Contraintes minimales pour maximiser la compatibilité
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false  // Désactivé pour simplifier
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      updateTopBar("✅ Caméra active");
    }

    // Activer le bouton uniquement après confirmation que la caméra fonctionne
    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }

    // Initialiser WebRTC uniquement si tout est prêt (dans une fonction séparée)
    if (typeof socket !== 'undefined' && socket.connected) {
      setupWebRTCWhenReady(stream);
    }

  } catch (err) {
    console.error("Erreur caméra:", err);
    let message = "❌ Erreur caméra";
    if (err.name === 'NotAllowedError') {
      message = "❌ Accès refusé - autorisez la caméra";
    } else if (err.name === 'NotFoundError') {
      message = "❌ Aucune caméra trouvée";
    }
    updateTopBar(message);

    // Réessayer avec des contraintes plus simples
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      updateTopBar("✅ Caméra active (mode compatible)");
    } catch (fallbackErr) {
      console.error("Erreur avec le mode compatible:", fallbackErr);
    }
  }
}

// 5. Configuration WebRTC (séparée et appelée uniquement quand tout est prêt)
function setupWebRTCWhenReady(stream) {
  // Vérifier que le socket est bien connecté
  if (typeof socket === 'undefined' || !socket.connected) {
    console.log("WebRTC: Socket non connecté, attente...");
    // Écouter la connexion socket
    if (typeof socket !== 'undefined') {
      socket.once('connect', () => {
        console.log("WebRTC: Socket maintenant connecté, initialisation...");
        setupWebRTC(stream);
      });
    }
    return;
  }

  // Demander les identifiants TURN
  socket.emit('request-turn-credentials', (credentials) => {
    if (!credentials) {
      console.error("WebRTC: Pas de réponse pour les identifiants TURN");
      return;
    }

    // Configuration WebRTC
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
          username: credentials.username,
          credential: credentials.credential
        },
        {
          urls: 'turns:legalshufflecam.ovh:5349?transport=tcp',
          username: credentials.username,
          credential: credentials.credential
        }
      ],
      iceTransportPolicy: 'all'
    };

    // Initialiser WebRTC uniquement si la fonction existe
    if (typeof window.connectSocketAndWebRTC === 'function') {
      window.connectSocketAndWebRTC(stream, rtcConfig);
      console.log("WebRTC: Initialisation réussie");
    }
  });
}

// 6. Gestion du bouton "Interlocuteur suivant" (version simple)
function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = "⏳ Recherche...";
  }

  // Vérifier que tout est prêt avant d'émettre ready-for-match
  if (typeof socket !== 'undefined' && socket.connected && currentStream) {
    updateTopBar("🔍 Recherche d'un partenaire...");
    socket.emit("ready-for-match");
  } else {
    console.error("Conditions non remplies pour ready-for-match");
    updateTopBar("❌ Conditions non remplies");
    btnNext.disabled = false;
    btnNext.textContent = "➡️ Réessayer";
  }
}

// 7. Initialisation minimale
window.addEventListener('load', () => {
  // Initialiser la caméra
  listCameras();

  // Configurer le bouton
  if (btnNext) {
    btnNext.onclick = handleNextClick;
  }

  // Configurer le sélecteur de caméra
  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      startCamera(e.target.value);
    });
  }

  // Nettoyage avant fermeture
  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
  });
});