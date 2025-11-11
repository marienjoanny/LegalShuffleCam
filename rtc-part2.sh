#!/bin/bash
echo "🧱 Ajout des fonctions WebRTC (partie 2)"
cat << 'JS' >> public/js/rtc-core.js

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
JS
echo "✅ Partie 2 ajoutée."
