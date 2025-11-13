// LegalShuffleCam • rtc-core.js (version corrigée avec fixSDPOrder)

let localStream;
let peerConnection;
let remoteId;

window.initSocket = function () {
  window.socket = io();
};

// 🔧 Corrige l’ordre des m-lines SDP (audio → vidéo)
function fixSDPOrder(sdp) {
  const sections = sdp.split('m=');
  const header = sections.shift();
  const ordered = ['audio', 'video'];
  const sorted = ordered.map(kind => sections.find(s => s.startsWith(kind))).filter(Boolean);
  return [header, ...sorted.map(s => 'm=' + s)].join('');
}

window.startCall = async function (partnerId) {
  remoteId = partnerId;
  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
    }
  };

  peerConnection.ontrack = e => {
    document.getElementById('remoteVideo').srcObject = e.streams[0];
    window.dispatchEvent(new CustomEvent('rtcConnected', {
      detail: { message: "Flux distant reçu." }
    }));
  };

  const offer = await peerConnection.createOffer();
  offer.sdp = fixSDPOrder(offer.sdp);
  await peerConnection.setLocalDescription(offer);
  window.socket.emit("offer", { to: remoteId, sdp: offer.sdp });
};

window.handleOffer = async function ({ from, sdp }) {
  remoteId = from;
  peerConnection = new RTCPeerConnection(rtcConfig);

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
    }
  };

  peerConnection.ontrack = e => {
    document.getElementById('remoteVideo').srcObject = e.streams[0];
    window.dispatchEvent(new CustomEvent('rtcConnected', {
      detail: { message: "Flux distant reçu." }
    }));
  };

  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp }));
  const answer = await peerConnection.createAnswer();
  answer.sdp = fixSDPOrder(answer.sdp);
  await peerConnection.setLocalDescription(answer);
  window.socket.emit("answer", { to: remoteId, sdp: answer.sdp });
};

window.handleAnswer = async function ({ sdp }) {
  console.log("🧠 SignalingState avant setRemoteDescription:", peerConnection.signalingState);
  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp }));
};

window.handleICECandidate = async function ({ candidate }) {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.warn("ICE ignoré :", err);
  }
};

window.disconnectWebRTC = function () {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    remoteId = null;
    window.dispatchEvent(new CustomEvent('rtcDisconnected', {
      detail: { message: "Connexion WebRTC terminée." }
    }));
  }
};

navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
  localStream = stream;
  document.getElementById('localVideo').srcObject = stream;
});

// Configuration RTC globale
const rtcConfig = {
  iceServers: [
    { urls: 'turn:legalshufflecam.ovh:3478?transport=udp', username: 'webrtc', credential: 'secret' },
    { urls: 'turn:legalshufflecam.ovh:5349?transport=tcp', username: 'webrtc', credential: 'secret' },
    { urls: 'turn:legalshufflecam.ovh:443?transport=tcp', username: 'webrtc', credential: 'secret' },
    { urls: 'stun:stun.l.google.com:19302' }
  ],
  iceTransportPolicy: 'all',
  sdpSemantics: 'unified-plan'
};