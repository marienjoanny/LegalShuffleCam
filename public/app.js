// LegalShuffleCam • app.js
// Version optimisée basée sur ta version fonctionnelle

// Éléments DOM
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

// Variables globales
window.faceVisible = true;
window.trackerInitialized = false;
const recentPartners =[];
let turnCredentials = null;
let isWebRTCReady = false;

// Fonctions utilitaires
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  if (btnNext) {
    // Le bouton est activé uniquement si tout est prêt
    const isReady = currentStream && isWebRTCReady;
    btnNext.disabled = !isReady;
    btnNext.textContent = isReady ? '➡️ Interlocuteur suivant' :
                                   currentStream ? '⏳ Connexion en cours...' :
                                   '... Préparation ...';
    btnNext.onclick = handleNextClick;
  }
}

function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
    isWebRTCReady = false;
  }
  if (remoteVideo) remoteVideo.srcObject = null;
  updateNextButtonState();

  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected && currentStream) {
      updateTopBar("🔍 Recherche d'un partenaire...");

      const startMatching = () => {
        console.log('[APP] Envoi de ready-for-match avec un flux valide.');
        socket.emit("ready-for-match");
      };

      if (turnCredentials) {
        startMatching();
      } else {
        socket.emit('request-turn-credentials', (credentials) => {
          turnCredentials = credentials;
          console.log('[APP] Identifiants TURN reçus après Next.');
          startMatching();
        });
      }
    } else {
      let errorMsg = "❌ ";
      if (!currentStream) errorMsg += "Flux vidéo manquant";
      else if (!socket?.connected) errorMsg += "Serveur déconnecté";
      else errorMsg += "Erreur inconnue";

      console.error('[APP] ' + errorMsg);
      updateTopBar(errorMsg);
    }
  }, 1500);
}

// Gestion des caméras
async function listCameras() {
  try {
    updateTopBar("🔍 Recherche des caméras disponibles...");

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

// Fonction d'initialisation WebRTC
function initiateWebRTC(stream) {
  if (!stream || typeof socket === 'undefined') {
    console.error('[APP] Conditions non remplies pour WebRTC');
    return;
  }

  const setupRTC = (credentials) => {
    window.connectSocketAndWebRTC(stream, credentials);
    isWebRTCReady = true;
    updateNextButtonState();
  };

  if (turnCredentials) {
    console.log('[APP] Utilisation des identifiants TURN existants.');
    setupRTC(turnCredentials);
    return;
  }

  console.log('[APP] Demande des identifiants TURN au serveur...');
  socket.emit('request-turn-credentials', (credentials) => {
    turnCredentials = credentials;
    console.log('[APP] Identifiants TURN reçus.');
    setupRTC(credentials);
  });
}

async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Accès à la caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    currentStream = stream;
    if (localVideo) localVideo.srcObject = stream;
    console.log('[APP] Flux média local initialisé avec succès.');

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    // Initialiser WebRTC uniquement si le socket est prêt
    if (typeof socket !== 'undefined' && socket.connected && currentStream) {
      initiateWebRTC(currentStream);
    } else {
      console.warn('[APP] Socket non connecté. WebRTC sera initialisé plus tard.');
      // Écouter la connexion socket pour initialiser WebRTC plus tard
      if (typeof socket !== 'undefined') {
        socket.once('connect', () => {
          console.log('[APP] Socket connecté. Initialisation WebRTC.');
          initiateWebRTC(currentStream);
        });
      }
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
    updateNextButtonState();

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    updateTopBar("❌ Caméra refusée ou indisponible.");

    // Tentative de secours avec des contraintes moins strictes
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      console.log('[APP] Flux média de secours initialisé.');

      if (typeof window.initFaceVisible === "function") {
        window.initFaceVisible(localVideo);
      }

      if (typeof socket !== 'undefined' && socket.connected) {
        initiateWebRTC(fallbackStream);
      }

      window.faceVisible = true;
      window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
      updateNextButtonState();

    } catch (fallbackErr) {
      console.error("Erreur avec le flux de secours :", fallbackErr);
    }
  }
}

// Capture d'un instantané du partenaire
function capturePartnerSnapshot(remoteId, ip) {
  if (!remoteVideo) return;

  const canvas = document.createElement("canvas");
  canvas.width = remoteVideo.videoWidth;
  canvas.height = remoteVideo.videoHeight;
  canvas.getContext("2d").drawImage(remoteVideo, 0, 0);
  const imageData = canvas.toDataURL("image/jpeg");

  recentPartners.unshift({
    remoteId,
    ip,
    image: imageData,
    timestamp: new Date().toISOString()
  });

  if (recentPartners.length > 5) recentPartners.pop();
  updateReportList();
}

// Mise à jour de la liste des signalements
function updateReportList() {
  if (!reportSelect) return;
  reportSelect.innerHTML = '<option disabled selected>Choisir un interlocuteur</option>';
  recentPartners.forEach((p, i) => {
    reportSelect.innerHTML += `<option value="${i}">#${i + 1} • ${p.remoteId} • ${new Date(p.timestamp).toLocaleTimeString()}</option>`;
  });
}

// Gestion des signalements
if (reportBtn && reportSelect) {
  reportBtn.addEventListener("click", () => {
    reportSelect.classList.toggle("visible");
  });

  reportSelect.addEventListener("change", () => {
    const index = reportSelect.value;
    const partner = recentPartners[index];
    const reason = prompt("Motif du signalement :");

    if (!reason || !partner) {
      console.log("❌ Signalement annulé.");
      return;
    }

    console.log("🚀 Envoi du signalement...\n" +
          "ID signalé : " + partner.remoteId + "\n" +
          "IP : " + partner.ip + "\n" +
          "Motif : " + reason);

    fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...partner,
        reason,
        reporterId: socket.id
      })
    }).then(res => {
      if (res.ok) {
        console.log("✅ Signalement transmis au serveur");
      } else {
        console.error("❌ Échec du signalement");
      }
    }).catch(err => {
      console.error("❌ Erreur réseau : " + err.message);
    });

    reportSelect.classList.remove("visible");
    reportSelect.selectedIndex = 0;
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
  isWebRTCReady = false;
  updateNextButtonState();
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[APP] Déconnexion WebRTC :", event.detail.message);
  if (topBar) {
    topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
  }
  isWebRTCReady = false;
  updateNextButtonState();
});

// Initialisation au chargement
window.addEventListener('load', () => {
  listCameras();

  // Écouter la connexion socket si elle arrive plus tard
  if (typeof socket !== 'undefined') {
    socket.on('connect', () => {
      console.log('[APP] Socket connecté. Initialisation WebRTC si flux disponible.');
      if (currentStream && !isWebRTCReady) {
        initiateWebRTC(currentStream);
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

updateNextButtonState();