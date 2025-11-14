// LegalShuffleCam • app.js
// Gestion des flux vidéo, des interactions utilisateur et des signalements

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
const recentPartners = [];
let turnCredentials = null;
let isWebRTCInitialized = false;

// Fonctions utilitaires
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  if (btnNext) {
    const isReady = currentStream && window.faceVisible && isWebRTCInitialized;
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

      const startMatching = () => {
        console.log('[APP] Envoi de ready-for-match avec un flux valide.');
        socket.emit("ready-for-match");
      };

      if (turnCredentials) {
        startMatching();
      } else {
        console.warn('[APP] Les identifiants TURN manquent pour le Next. Redemande au serveur...');
        socket.emit('request-turn-credentials', (credentials) => {
            turnCredentials = credentials;
            startMatching();
        });
      }
    } else {
      console.error('[APP] Erreur : currentStream est null ou socket non connecté.');
      updateTopBar("❌ Connexion perdue ou flux manquant. Rechargez la page.");
      updateNextButtonState();
    }
  }, 1500);
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
      updateNextButtonState();
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur caméra. Vérifiez les permissions.");
    updateNextButtonState();
  }
}

async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Demande de permissions caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    currentStream = stream;
    if (localVideo) {
      localVideo.srcObject = stream;
      console.log('[APP] Flux vidéo local affiché avec succès.');
    } else {
      console.error('[APP] Erreur : élément localVideo introuvable dans le DOM.');
    }

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    if (currentStream) {
      initiateWebRTC(currentStream);
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
        isWebRTCInitialized = true;

        window.connectSocketAndWebRTC(stream, credentials);

        if (typeof window.initSocketAndListeners === 'function') {
            window.initSocketAndListeners();
        } else {
            console.error('[APP] Erreur : initSocketAndListeners non défini (listener.js).');
        }
        updateNextButtonState();
        updateTopBar("Détection de visage...");
    }

    if (typeof socket === 'undefined' || !socket.connected) {
        console.error("[APP] Le socket n'est pas prêt. Initialisation RTC reportée.");
        updateTopBar("❌ Le socket n'est pas connecté.");
        updateNextButtonState();
        return;
    }

    console.log('[APP] Demande initiale des identifiants TURN au serveur...');
    socket.emit('request-turn-credentials', (credentials) => {
        console.log('[APP] Identifiants TURN LT-Cred reçus à l\'initialisation.');
        setupRTC(credentials);
    });
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
  if (window.topBar) {
    window.topBar.textContent = `⚠ ${event.detail.message}`;
  }
  updateNextButtonState();
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[APP] Déconnexion WebRTC :", event.detail.message);
  if (window.topBar) {
    window.topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
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