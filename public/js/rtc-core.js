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

// 🧹 Simplifie le SDP pour éviter les codecs et extensions instables
function simplifySDP(sdp) {
  return sdp
    .split('\r\n')
    .filter(line => {
      if (line.includes('rtpmap') && !line.includes('VP8') && !line.includes('H264/90000')) return false;
      if (line.includes('rtpmap') && /(VP9|rtx|red|ulpfec)/.test(line)) return false;
      if (line.includes('rtcp-fb') && /(goog-remb|transport-cc)/.test(line)) return false;
      if (line.startsWith('a=extmap:')) return false;
      return true;
    })
    .join('\r\n');
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
  offer.sdp = simplifySDP(fixSDPOrder(offer.sdp));
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

  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: simplifySDP(sdp) }));
  const answer = await peerConnection.createAnswer();
  answer.sdp = simplifySDP(fixSDPOrder(answer.sdp));
  await peerConnection.setLocalDescription(answer);
  window.socket.emit("answer", { to: remoteId, sdp: answer.sdp });
};

window.handleAnswer = async function ({ sdp }) {
  console.log("🧠 SignalingState avant setRemoteDescription:", peerConnection.signalingState);
  await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: simplifySDP(sdp) }));
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

  if (stream.getVideoTracks().length === 0) {
    console.warn("⚠️ Aucun flux vidéo détecté.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Caméra non détectée. Activez-la pour continuer." }
    }));
  }

  setInterval(() => {
    const video = document.getElementById('localVideo');
    const visible = video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
    window.dispatchEvent(new CustomEvent('faceCheck', {
      detail: { visible }
    }));
  }, 3000);
});

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