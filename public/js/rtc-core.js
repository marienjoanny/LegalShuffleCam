// LegalShuffleCam • rtc-core.js (version finale avec diagnostics ICE complets + patch mobile-friendly + AV1 filter + codec logs)

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
let iceBuffer = [];
let partnerSocketId = null;
let iceSentCount = 0;
let iceBufferedCount = 0;

// --- SDP Filter ---
function filterSDP(sdp) {
  if (!sdp) return sdp;
  return sdp
    .replace(/a=rtpmap:99 AV1\/90000[\s\S]*?a=fmtp:100 apt=99\r\n/g, '')
    .replace(/a=rtpmap:39 AV1\/90000[\s\S]*?a=rtpmap:40 rtx\/90000\r\n/g, '');
}

// --- ICE ---
function sendIce(candidate) {
  if (!candidate) return console.warn("[RTC-ICE] Candidat ICE invalide ignoré.");
  if (partnerSocketId) {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
    iceSentCount++;
    console.log(`[RTC-ICE] ✅ Candidat ICE envoyé à ${partnerSocketId} (total: ${iceSentCount})`);
  } else {
    iceBuffer.push(candidate);
    iceBufferedCount++;
    console.log(`[RTC-ICE] ⏳ ICE bufferisé (${iceBufferedCount})`);
  }
}

function flushIceBuffer() {
  if (!partnerSocketId) return console.warn("[RTC-ICE] ⚠ Pas de partnerSocketId.");
  if (iceBuffer.length === 0) return console.log("[RTC-ICE] 🗑 Tampon ICE vide.");
  console.log(`[RTC-ICE] 📤 Vidage tampon (${iceBuffer.length}) vers ${partnerSocketId}`);
  iceBuffer.forEach(candidate => {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
    iceSentCount++;
  });
  iceBuffer = [];
  iceBufferedCount = 0;
}

// --- Flux local ---
async function initLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;
    console.log("[RTC] 🎥 Flux local prêt.");
    return stream;
  } catch (err) {
    console.error("[RTC] ❌ Erreur caméra/micro :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Accès caméra/micro impossible.", error: err }
    }));
    throw err;
  }
}

// --- Connexion WebRTC ---
function createPeerConnection(stream) {
  if (!stream) return console.error("[RTC] ❌ Flux local manquant.");

  const pc = new RTCPeerConnection(RTC_CONFIG);
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.onicecandidate = (event) => {
    if (event.candidate) sendIce(event.candidate);
  };

  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    const stream = event.streams?.[0] || new MediaStream([event.track]);
    if (remoteVideo && stream) {
      remoteVideo.srcObject = stream;
      remoteVideo.play().catch(err => {
        console.warn("[RTC] ⚠ remoteVideo play() bloqué :", err);
      });
      console.log("[RTC] 🎥 Flux distant attaché.");
    } else {
      console.warn("[RTC] ⚠ remoteVideo ou stream manquant.");
    }
  };

  return pc;
}

// --- Appel sortant ---
async function startCall(partnerId) {
  console.log(`[RTC] 📞 Appel vers ${partnerId}`);
  if (!partnerId || typeof partnerId !== 'string') return console.error("[RTC] ❌ partnerId invalide");

  try {
    if (!localStream) {
      localStream = await initLocalStream();
      document.getElementById("localVideo").srcObject = localStream;
    }

    remoteId = partnerId;
    partnerSocketId = partnerId;
    window.lastRTCPartnerId = partnerId;

    if (iceBuffer.length > 0) flushIceBuffer();

    peerConnection = createPeerConnection(localStream);
    const offer = await peerConnection.createOffer();
    offer.sdp = filterSDP(offer.sdp);
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { to: partnerId, sdp: offer });
    console.log(`[RTC] 📤 Offre envoyée à ${partnerId}`);
  } catch (err) {
    console.error("[RTC] ❌ Erreur startCall:", err);
  }
}

// --- Réception d'une offre ---
async function handleOffer(data) {
  if (!data.sdp || !data.from) return;

  if (!localStream) {
    localStream = await initLocalStream();
    document.getElementById("localVideo").srcObject = localStream;
  }

  remoteId = data.from;
  partnerSocketId = data.from;
  window.lastRTCPartnerId = data.from;

  if (iceBuffer.length > 0) flushIceBuffer();

  peerConnection = createPeerConnection(localStream);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

  peerConnection.getReceivers().forEach(receiver => {
    console.log("[RTC] 📡 Codec négocié (offer):", receiver.track.kind, receiver.track);
  });

  const answer = await peerConnection.createAnswer();
  answer.sdp = filterSDP(answer.sdp);
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", { to: remoteId, sdp: answer });
}

// --- Réception d'une réponse ---
async function handleAnswer(data) {
  if (!data.sdp || !peerConnection) return;
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

  peerConnection.getReceivers().forEach(receiver => {
    console.log("[RTC] 📡 Codec négocié (answer):", receiver.track.kind, receiver.track);
  });
}

// --- Réception d'un ICE ---
async function handleICECandidate(data) {
  if (!data.candidate || !peerConnection) return;
  await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
}

// --- Déconnexion ---
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

// --- Partenaire reçu ---
function setupPartnerListener() {
  socket.on("partner", (data) => {
    if (!data?.id) return console.error("[RTC] ❌ Données partenaire invalides:", data);
    partnerSocketId = data.id;
    console.log(`[RTC] 🤝 Partenaire reçu : ${partnerSocketId}`);
    if (iceBuffer.length > 0) flushIceBuffer();
  });
}

// --- Initialisation Socket.IO ---
function initSocket() {
  socket = io();

  socket.on("connect", () => {
    console.log(`[SOCKET] ✅ Connecté (id: ${socket.id})`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] ❌ Déconnecté (raison: ${reason})`);
  });

  socket.on("connect_error", (err) => {
    console.error("[SOCKET] ⚠ Erreur de connexion :", err);
  });

  setupPartnerListener();

  socket.on("offer", handleOffer);
  socket.on("answer", handleAnswer);
  socket.on("ice-candidate", handleICECandidate);
}

// --- Exports globaux ---
window.initLocalStream = initLocalStream;
window.startCall = startCall;
window.handleOffer = handleOffer;
window.handleAnswer = handleAnswer;
window.handleICECandidate = handleICECandidate;
window.disconnectWebRTC = disconnectWebRTC;
window.initSocket = initSocket;