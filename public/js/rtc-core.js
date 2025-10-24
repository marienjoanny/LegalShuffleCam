// LegalShuffleCam • rtc-core.js (version optimisée avec diagnostics)
// Gestion centrale des connexions WebRTC, des flux multimédias et des erreurs.

// --- Configuration globale ---
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// --- Variables globales ---
let localStream = null;
let peerConnection = null;
let remoteId = null;
let socket = null;
window.lastRTCPartnerId = null; // Pour l'audit

// --- Fonctions principales ---
/**
 * Initialise le flux local (caméra + micro).
 * @returns {Promise<MediaStream>} Flux multimédia local.
 */
async function initLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    localStream = stream;
    console.log("[RTC] Flux local initialisé avec succès.");
    return stream;
  } catch (err) {
    console.error("[RTC] Erreur lors de l'initialisation du flux local :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Impossible d'accéder à la caméra/micro.", error: err }
    }));
    throw err;
  }
}

/**
 * Crée une nouvelle connexion WebRTC.
 * @param {MediaStream} stream - Flux local à partager.
 * @returns {RTCPeerConnection} Nouvelle instance de peerConnection.
 */
function createPeerConnection(stream) {
  if (!stream) {
    console.error("[RTC-DIAG] Pas de flux local pour créer peerConnection.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Flux local manquant pour WebRTC." }
    }));
    return null;
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);

  // Ajoute les tracks locaux
  stream.getTracks().forEach(track => {
    if (track.kind === 'video' || track.kind === 'audio') {
      pc.addTrack(track, stream);
      console.log(`[RTC-DIAG] Track ajouté : ${track.kind}`);
    }
  });

  // Gestion des candidats ICE
  pc.onicecandidate = (event) => {
    if (!remoteId) {
      console.warn("[RTC-DIAG] remoteId non défini. ICE non envoyé.");
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "remoteId manquant pour envoyer ICE." }
      }));
      return;
    }
    if (event.candidate) {
      console.log(`[RTC-DIAG] ICE envoyé à remoteId: ${remoteId}`);
      socket.emit("ice-candidate", { to: remoteId, candidate: event.candidate });
    } else {
      console.log("[RTC-DIAG] Tous les candidats ICE envoyés.");
    }
  };

  // Gestion des tracks distants
  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      console.log("[RTC-DIAG] Flux distant reçu et assigné.");
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { stream: event.streams[0] }
      }));
    }
  };

  // Gestion des changements d'état
  pc.onconnectionstatechange = () => {
    console.log(`[RTC-DIAG] État de la connexion : ${pc.connectionState}`);
    if (pc.connectionState === "failed") {
      window.dispatchEvent(new CustomEvent('rtcFailed', {
        detail: { error: "Échec de connexion WebRTC." }
      }));
    } else if (pc.connectionState === "connected") {
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { message: "Connexion WebRTC établie." }
      }));
    }
  };

  return pc;
}

/**
 * Démarre un appel WebRTC avec un partenaire.
 * @param {string} partnerId - ID du partenaire distant.
 */
async function startCall(partnerId) {
  console.log(`[RTC-DIAG] startCall appelé avec partnerId: ${partnerId} (type: ${typeof partnerId})`);
  if (!partnerId || typeof partnerId !== 'string') {
    console.error("[RTC-DIAG] ERREUR : partnerId est undefined/null/invalide.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "ID partenaire invalide. Impossible de démarrer l'appel." }
    }));
    return;
  }

  try {
    if (!localStream) {
      localStream = await initLocalStream();
      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.srcObject = localStream;
    }

    remoteId = partnerId;
    window.lastRTCPartnerId = partnerId; // Pour l'audit
    console.log(`[RTC-DIAG] remoteId assigné : ${remoteId}`);

    peerConnection = createPeerConnection(localStream);
    if (!peerConnection) {
      throw new Error("Échec de la création de peerConnection.");
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log(`[RTC-DIAG] Offre créée pour remoteId: ${remoteId}`);
    socket.emit("offer", { to: remoteId, sdp: offer });
  } catch (err) {
    console.error("[RTC-DIAG] Erreur dans startCall :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de startCall.", error: err }
    }));
  }
}

/**
 * Gère une offre WebRTC reçue.
 * @param {Object} data - Données de l'offre (sdp + expéditeur).
 */
async function handleOffer(data) {
  console.log(`[RTC-DIAG] handleOffer appelé avec data:`, data);
  if (!data.sdp || !data.from) {
    console.error("[RTC-DIAG] ERREUR : Données d'offre invalides.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Données d'offre invalides." }
    }));
    return;
  }

  try {
    if (!localStream) {
      localStream = await initLocalStream();
      const localVideo = document.getElementById("localVideo");
      if (localVideo) localVideo.srcObject = localStream;
    }

    remoteId = data.from;
    window.lastRTCPartnerId = remoteId;
    console.log(`[RTC-DIAG] remoteId assigné depuis handleOffer : ${remoteId}`);

    peerConnection = createPeerConnection(localStream);
    if (!peerConnection) {
      throw new Error("Échec de la création de peerConnection.");
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log(`[RTC-DIAG] Réponse créée pour remoteId: ${remoteId}`);
    socket.emit("answer", { to: remoteId, sdp: answer });
  } catch (err) {
    console.error("[RTC-DIAG] Erreur dans handleOffer :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de handleOffer.", error: err }
    }));
  }
}

/**
 * Gère une réponse WebRTC reçue.
 * @param {Object} data - Données de la réponse (sdp).
 */
async function handleAnswer(data) {
  console.log(`[RTC-DIAG] handleAnswer appelé avec data:`, data);
  if (!data.sdp) {
    console.error("[RTC-DIAG] ERREUR : Données de réponse invalides.");
    return;
  }

  try {
    if (!peerConnection) {
      throw new Error("Aucune peerConnection active pour appliquer la réponse.");
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    console.log("[RTC-DIAG] Réponse appliquée avec succès.");
  } catch (err) {
    console.error("[RTC-DIAG] Erreur dans handleAnswer :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de handleAnswer.", error: err }
    }));
  }
}

/**
 * Gère un candidat ICE reçu.
 * @param {Object} data - Données du candidat ICE.
 */
async function handleICECandidate(data) {
  console.log(`[RTC-DIAG] handleICECandidate appelé avec data:`, data);
  if (!data.candidate) {
    console.error("[RTC-DIAG] ERREUR : Candidat ICE invalide.");
    return;
  }

  try {
    if (!peerConnection) {
      throw new Error("Aucune peerConnection active pour ajouter le candidat ICE.");
    }
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    console.log("[RTC-DIAG] Candidat ICE ajouté avec succès.");
  } catch (err) {
    console.error("[RTC-DIAG] Erreur dans handleICECandidate :", err);
  }
}

/**
 * Déconnecte la session WebRTC actuelle.
 */
function disconnectWebRTC() {
  if (peerConnection) {
    peerConnection.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    peerConnection.close();
    peerConnection = null;
    console.log("[RTC-DIAG] Connexion WebRTC fermée.");
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    console.log("[RTC-DIAG] Flux local arrêté.");
  }

  remoteId = null;
  window.lastRTCPartnerId = null;
  window.dispatchEvent(new CustomEvent('rtcDisconnected', {
    detail: { message: "Déconnexion WebRTC effectuée." }
  }));
}

/**
 * Initialise Socket.IO et configure les écouteurs.
 */
function initSocket() {
  socket = io();
  socket.on("connect", () => {
    console.log(`[RTC-DIAG] Connecté au serveur Socket.IO (id: ${socket.id}).`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[RTC-DIAG] Déconnecté du serveur Socket.IO (raison: ${reason}).`);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: `Déconnexion Socket.IO : ${reason}` }
    }));
  });

  socket.on("connect_error", (err) => {
    console.error("[RTC-DIAG] Erreur de connexion Socket.IO :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur Socket.IO.", error: err }
    }));
  });
}

// --- Export des fonctions globales ---
window.initLocalStream = initLocalStream;
window.startCall = startCall;
window.handleOffer = handleOffer;
window.handleAnswer = handleAnswer;
window.handleICECandidate = handleICECandidate;
window.disconnectWebRTC = disconnectWebRTC;
window.initSocket = initSocket;
