// LegalShuffleCam • rtc-core.js
// Configuration WebRTC optimisée pour Coturn

// Fonction pour simplifier les SDP et supprimer les codecs non essentiels
function simplifySDP(sdp) {
  return sdp
    .split('\r\n')
    .filter(line => {
      if (line.includes('rtpmap') && !line.includes('VP8') && !line.includes('opus/48000')) return false;
      if (line.includes('rtpmap') && /(VP9|rtx|red|ulpfec)/.test(line)) return false;
      if (line.includes('rtcp-fb') && !line.includes('nack') && !line.includes('goog-remb')) return false;
      if (line.startsWith('a=extmap:') && !line.includes('urn:ietf:params:rtp-hdrext:sdes:mid')) return false;
      return true;
    })
    .join('\r\n');
}

// Configuration WebRTC avec Coturn
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
      username: 'webrtc',
      credential: 'secret',
      credentialType: 'password'
    },
    {
      urls: 'turns:legalshufflecam.ovh:5349',
      username: 'webrtc',
      credential: 'secret',
      credentialType: 'password'
    }
  ],
  iceTransportPolicy: 'relay', // Force l'utilisation de TURN
  sdpSemantics: 'unified-plan'
};

// Variable globale pour la connexion WebRTC
let peerConnection;
let remoteId;
let negotiationTimeout;

// Fonction pour démarrer un appel WebRTC
window.startCall = async function(partnerId) {
  remoteId = partnerId;
  peerConnection = new RTCPeerConnection(rtcConfig);

  // Ajoute les pistes locales
  if (window.currentStream) {
    window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));
  }

  // Gestion des candidats ICE
  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      console.log("Nouveau candidat ICE :", e.candidate.candidate);
      if (e.candidate.candidate.includes('typ relay')) {
        console.log("✅ Candidat RELAY trouvé !");
      }
      window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
    }
  };

  // Gestion des flux distants
  peerConnection.ontrack = e => {
    console.log("Flux distant reçu !");
    if (document.getElementById('remoteVideo')) {
      document.getElementById('remoteVideo').srcObject = e.streams[0];
    }
    window.dispatchEvent(new CustomEvent('rtcConnected', {
      detail: { message: "Flux distant reçu." }
    }));
  };

  // Gestion des changements d'état
  peerConnection.onconnectionstatechange = () => {
    console.log(`État de la connexion: ${peerConnection.connectionState}`);
    if (peerConnection.connectionState === 'connected') {
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { message: "Connexion WebRTC établie." }
      }));
    }
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log(`État ICE: ${peerConnection.iceConnectionState}`);
    if (peerConnection.iceConnectionState === 'failed') {
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Échec de la connexion WebRTC." }
      }));
    }
  };

  // Crée une offre
  const offer = await peerConnection.createOffer();
  offer.sdp = simplifySDP(offer.sdp);
  await peerConnection.setLocalDescription(offer);
  window.socket.emit("offer", { to: remoteId, sdp: offer.sdp });

  // Timeout pour éviter les blocages
  negotiationTimeout = setTimeout(() => {
    console.warn("Timeout : Négociation WebRTC trop longue.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "La connexion a expiré. Réessayez." }
    }));
  }, 10000);
};

// Fonction pour gérer une offre reçue
window.handleOffer = async function({ from, sdp }) {
  remoteId = from;
  peerConnection = new RTCPeerConnection(rtcConfig);

  // Ajoute les pistes locales
  if (window.currentStream) {
    window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));
  }

  // Gestion des candidats ICE
  peerConnection.onicecandidate = e => {
    if (e.candidate) {
      console.log("Nouveau candidat ICE :", e.candidate.candidate);
      window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
    }
  };

  // Gestion des flux distants
  peerConnection.ontrack = e => {
    console.log("Flux distant reçu !");
    if (document.getElementById('remoteVideo')) {
      document.getElementById('remoteVideo').srcObject = e.streams[0];
    }
    window.dispatchEvent(new CustomEvent('rtcConnected', {
      detail: { message: "Flux distant reçu." }
    }));
  };

  // Gestion des changements d'état
  peerConnection.onconnectionstatechange = () => {
    console.log(`État de la connexion: ${peerConnection.connectionState}`);
  };

  peerConnection.oniceconnectionstatechange = () => {
    console.log(`État ICE: ${peerConnection.iceConnectionState}`);
  };

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: simplifySDP(sdp) }));
    const answer = await peerConnection.createAnswer();
    answer.sdp = simplifySDP(answer.sdp);
    await peerConnection.setLocalDescription(answer);
    window.socket.emit("answer", { to: remoteId, sdp: answer.sdp });
    clearTimeout(negotiationTimeout);
  } catch (err) {
    console.error("Erreur setRemoteDescription :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur de connexion WebRTC. Vérifiez votre réseau.", error: err }
    }));
  }
};

// Fonction pour gérer une réponse reçue
window.handleAnswer = async function({ sdp }) {
  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: simplifySDP(sdp) }));
    clearTimeout(negotiationTimeout);
  } catch (err) {
    console.error("Erreur setRemoteDescription :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur de connexion WebRTC. Vérifiez votre réseau.", error: err }
    }));
  }
};

// Fonction pour gérer un candidat ICE reçu
window.handleICECandidate = async function({ candidate }) {
  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.warn("ICE ignoré :", err);
  }
};

// Fonction pour déconnecter WebRTC
window.disconnectWebRTC = function() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    remoteId = null;
    clearTimeout(negotiationTimeout);
    window.dispatchEvent(new CustomEvent('rtcDisconnected', {
      detail: { message: "Connexion WebRTC terminée." }
    }));
  }
};