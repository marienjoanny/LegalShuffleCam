// LegalShuffleCam • rtc-core.js (version optimisée avec tampon ICE)
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
let iceBuffer = [];
let partnerSocketId = null;
let socket = null;
window.lastRTCPartnerId = null;

/**
 * Envoie un candidat ICE au partenaire.
 */
function sendIce(candidate) {
  if (partnerSocketId) {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
  } else {
    iceBuffer.push(candidate);
  }
}

/**
 * Vide le tampon ICE si le partenaire est connu.
 */
function flushIceBuffer() {
  if (partnerSocketId && iceBuffer.length > 0) {
    iceBuffer.forEach(c => socket.emit("ice-candidate", { to: partnerSocketId, candidate: c }));
    iceBuffer = [];
  }
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
  if (!partnerId) return;
  if (!localStream) {
    localStream = await initLocalStream();
    const localVideo = document.getElementById("localVideo");
    if (localVideo) localVideo.srcObject = localStream;
  }

  remoteId = partnerId;
  partnerSocketId = partnerId;
  flushIceBuffer();
  window.lastRTCPartnerId = partnerId;

  peerConnection = createPeerConnection(localStream);
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", { to: remoteId, sdp: offer });
}

async function handleOffer(data) {
  if (!data.sdp || !data.from) return;

  if (!localStream) {
    localStream = await initLocalStream();
    const localVideo = document.getElementById("localVideo");
    if (localVideo) localVideo.srcObject = localStream;
  }

  remoteId = data.from;
  partnerSocketId = data.from;
  flushIceBuffer();
  window.lastRTCPartnerId = data.from;

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

function initSocket() {
  socket = io();
  socket.on("connect", () => {
    console.log(`[RTC] Connecté (id: ${socket.id})`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[RTC] Déconnecté : ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("[RTC] Erreur Socket.IO :", err);
  });

  socket.on("partner", (data) => {
    if (data.id) {
      partnerSocketId = data.id;
      flushIceBuffer();
    }
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
