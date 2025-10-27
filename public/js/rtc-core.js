// LegalShuffleCam • rtc-core.js (version finale avec diagnostics ICE complets)
// Gestion des connexions WebRTC, tampon ICE, et logs détaillés.

// --- Configuration et variables globales ---
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

let localStream = null;
let peerConnection = null;
let remoteId = null;
let socket = null;
let iceBuffer = [];          // Tampon pour les candidats ICE
let partnerSocketId = null;  // ID du partenaire pour l'envoi des ICE
let iceSentCount = 0;        // Compteur de candidats ICE envoyés (diagnostic)
let iceBufferedCount = 0;    // Compteur de candidats ICE bufferisés (diagnostic)

// --- Fonctions de gestion des ICE ---
function sendIce(candidate) {
  if (!candidate) {
    console.warn("[RTC-ICE] Candidat ICE invalide ignoré.");
    return;
  }

  if (partnerSocketId) {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
    iceSentCount++;
    console.log(`[RTC-ICE] ✅ Candidat ICE envoyé à ${partnerSocketId} (total envoyé: ${iceSentCount})`);
  } else {
    iceBuffer.push(candidate);
    iceBufferedCount++;
    console.log(`[RTC-ICE] ⏳ Candidat ICE bufferisé (total bufferisé: ${iceBufferedCount}, tampon: ${iceBuffer.length})`);
  }
}

function flushIceBuffer() {
  if (!partnerSocketId) {
    console.warn("[RTC-ICE] ⚠ Impossible de vider le tampon : partnerSocketId non défini.");
    return;
  }

  if (iceBuffer.length === 0) {
    console.log("[RTC-ICE] 🗑 Tampon ICE déjà vide.");
    return;
  }

  console.log(`[RTC-ICE] 📤 Vidage du tampon : ${iceBuffer.length} candidats vers ${partnerSocketId}`);
  iceBuffer.forEach(candidate => {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
    iceSentCount++;
  });
  iceBufferedCount = 0;
  iceBuffer = [];
}

// --- Fonctions principales ---
async function initLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;
    console.log("[RTC] Flux local initialisé avec succès.");
    return stream;
  } catch (err) {
    console.error("[RTC] Erreur init flux local :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Accès caméra/micro impossible.", error: err }
    }));
    throw err;
  }
}

function createPeerConnection(stream) {
  if (!stream) {
    console.error("[RTC] Flux local manquant.");
    return null;
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = (event) => {
    if (!remoteId) return;
    if (event.candidate) sendIce(event.candidate);
  };

  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
    }
  };

  return pc;
}

async function startCall(partnerId) {
  console.log(`[RTC] Démarrage de l'appel avec partnerId: ${partnerId}`);

  if (!partnerId || typeof partnerId !== 'string') {
    console.error("[RTC] ❌ partnerId invalide:", partnerId);
    return;
  }

  try {
    if (!localStream) {
      localStream = await initLocalStream();
      document.getElementById("localVideo").srcObject = localStream;
    }

    remoteId = partnerId;
    partnerSocketId = partnerId;
    window.lastRTCPartnerId = partnerId;
    console.log(`[RTC] 🔗 Partenaire défini : ${partnerSocketId}`);

    if (iceBuffer.length > 0) {
      flushIceBuffer();
    } else {
      console.log("[RTC-ICE] 🟢 Tampon ICE déjà vide, aucun candidat à envoyer.");
    }

    peerConnection = createPeerConnection(localStream);
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { to: partnerId, sdp: offer });
    console.log(`[RTC] 📤 Offre envoyée à ${partnerId}`);
  } catch (err) {
    console.error("[RTC] ❌ Erreur dans startCall:", err);
  }
}

async function handleOffer(data) {
  if (!data.sdp || !data.from) return;

  if (!localStream) {
    localStream = await initLocalStream();
    document.getElementById("localVideo").srcObject = localStream;
  }

  remoteId = data.from;
  partnerSocketId = data.from;
  window.lastRTCPartnerId = data.from;

  if (iceBuffer.length > 0) {
    flushIceBuffer();
  }

  peerConnection = createPeerConnection(localStream);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { to: remoteId, sdp: answer });
}

async function handleAnswer(data) {
  if (!data.sdp || !peerConnection) return;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
}

async function handleICECandidate(data) {
  if (!data.candidate || !peerConnection) return;
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

function disconnectWebRTC() {
  if (peerConnection) {
    peerConnection.getSenders().forEach(sender => sender.track?.stop());
    peerConnection.close();
    peerConnection = null;
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  remoteId = null;
  window.lastRTCPartnerId = null;
  window.dispatchEvent(new CustomEvent('rtcDisconnected'));
}

// --- Écouteur pour l'événement "partner" ---
function setupPartnerListener() {
  socket.on("partner", (data) => {
    if (!data || !data.id) {
      console.error("[RTC] ❌ Données partenaire invalides:", data);
      return;
    }

    partnerSocketId = data.id;
    console.log(`[RTC] 🤝 Partenaire reçu : ${partnerSocketId}`);

    if (iceBuffer.length > 0) {
      flushIceBuffer();
    } else {
      console.log("[RTC-ICE] 🟢 Tampon vide, aucun candidat à envoyer.");
    }
  });
}

// --- Initialisation Socket.IO avec écouteurs ---
function initSocket() {
  socket = io();

  socket.on("connect", () => {
    console.log(`[SOCKET] ✅ Connecté (id: ${socket.id})`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] ❌ Déconnecté (raison: ${reason})`);
  });

  setupPartnerListener();
  // ... (autres écouteurs pour offer/answer/ice-candidate) ...
}

// --- Export des fonctions ---
window.initLocalStream = initLocalStream;
window.startCall = startCall;
window.handleOffer = handleOffer;
window.handleAnswer = handleAnswer;
window.handleICECandidate = handleICECandidate;
window.disconnectWebRTC = disconnectWebRTC;
window.initSocket = initSocket;