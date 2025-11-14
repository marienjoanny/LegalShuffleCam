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

// NOUVELLE VARIABLE GLOBALE pour stocker les identifiants TURN dynamiques
let turnCredentials = null; 

// Fonctions utilitaires
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

function updateNextButtonState() {
  if (btnNext) {
    btnNext.disabled = false;
    btnNext.textContent = '➡️ Interlocuteur suivant';
    btnNext.onclick = handleNextClick;
  }
}

function handleNextClick() {
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;
  updateNextButtonState();
  
  setTimeout(() => {
    if (typeof socket !== 'undefined' && socket.connected && currentStream) {
      updateTopBar("🔍 Recherche d’un partenaire...");

      // LOGIQUE LT-CRED : S'assurer que les identifiants sont là avant de demander un match
      const startMatching = () => {
        console.log('[APP] Envoi de ready-for-match avec un flux valide.');
        socket.emit("ready-for-match");
      };

      if (turnCredentials) {
        startMatching();
      } else {
        // Demande les identifiants au serveur
        socket.emit('request-turn-credentials', (credentials) => {
            turnCredentials = credentials;
            console.log('[APP] Identifiants TURN LT-Cred reçus après Next.');
            startMatching();
        });
      }

    } else {
      console.error('[APP] Erreur : currentStream est null ou socket non connecté.');
      updateTopBar("❌ Connexion perdue ou flux manquant. Rechargez la page.");
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
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur caméra. Vérifiez les permissions.");
  }
}

// Nouvelle fonction d'initialisation WebRTC qui gère la récupération des credentials
function initiateWebRTC(stream) {
    if (typeof window.connectSocketAndWebRTC !== "function") {
        console.error('[APP] Erreur : connectSocketAndWebRTC non défini (rtc-core.js).');
        return;
    }

    const setupRTC = (credentials) => {
        // 1. Configure WebRTC Core avec les identifiants
        window.connectSocketAndWebRTC(stream, credentials);
        
        // 2. IMPORTANT : Initialise les écouteurs Socket.IO (listener.js)
        if (typeof window.initSocketAndListeners === 'function') {
            window.initSocketAndListeners();
        } else {
            console.error('[APP] Erreur : initSocketAndListeners non défini (listener.js).');
        }
    }

    if (turnCredentials) {
        console.log('[APP] Appel de connectSocketAndWebRTC avec flux et LT-Cred valide.');
        setupRTC(turnCredentials);
        return;
    }

    // Récupère les identifiants pour la première fois
    console.log('[APP] Demande initiale des identifiants TURN au serveur...');
    socket.emit('request-turn-credentials', (credentials) => {
        turnCredentials = credentials;
        console.log('[APP] Identifiants TURN LT-Cred reçus à l\'initialisation.');
        setupRTC(turnCredentials);
    });
}

async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });

    currentStream = stream;
    if (localVideo) localVideo.srcObject = stream;
    console.log('[APP] Flux média local initialisé avec succès :', currentStream);

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }
    
    // REMPLACEMENT DE L'APPEL STATIQUE
    if (currentStream) {
      // Le socket doit être défini ici, car initiateWebRTC l'utilise
      if (typeof socket === 'undefined') {
          // Si le socket n'est pas encore globalement initialisé, nous ne pouvons pas appeler initiateWebRTC
          console.error("[APP] Le socket n'est pas défini. Assurez-vous qu'il est initialisé avant d'appeler initiateWebRTC.");
          updateTopBar("❌ Erreur d'initialisation du socket.");
          return;
      }
      initiateWebRTC(currentStream);
    } else {
      console.error('[APP] Erreur : currentStream est null ou undefined.');
    }

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

  } catch (err) {
    console.error("Erreur lors de l'accès à la caméra :", err);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      currentStream = fallbackStream;
      if (localVideo) localVideo.srcObject = fallbackStream;
      console.log('[APP] Flux média fallback initialisé avec succès :', currentStream);

      if (typeof window.initFaceVisible === "function") {
        window.initFaceVisible(localVideo);
      }
      
      // REMPLACEMENT DE L'APPEL STATIQUE
      if (currentStream) {
        // Le socket doit être défini ici, car initiateWebRTC l'utilise
        if (typeof socket === 'undefined') {
          console.error("[APP] Le socket n'est pas défini. Assurez-vous qu'il est initialisé avant d'appeler initiateWebRTC.");
          updateTopBar("❌ Erreur d'initialisation du socket.");
          return;
        }
        initiateWebRTC(currentStream);
      }

      window.faceVisible = true;
      window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));

    } catch (fallbackErr) {
      console.error("Erreur lors de l'accès à la caméra de secours :", fallbackErr);
      updateTopBar("❌ Caméra refusée ou indisponible.");
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
    // Remplacement de 'alert' par une fonction utilitaire (ou un modal custom en production)
    const reason = prompt("Motif du signalement :"); 

    if (!reason || !partner) {
      // Remplacement de 'alert'
      console.log("❌ Signalement annulé.");
      return;
    }

    // Remplacement de 'alert'
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
      // Remplacement de 'alert'
      if (res.ok) {
        console.log("✅ Signalement transmis au serveur");
      } else {
        console.error("❌ Échec du signalement");
      }
    }).catch(err => {
      // Remplacement de 'alert'
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
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[APP] Déconnexion WebRTC :", event.detail.message);
  if (window.topBar) {
    window.topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
  }
});

// Initialisation
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

updateNextButtonState();