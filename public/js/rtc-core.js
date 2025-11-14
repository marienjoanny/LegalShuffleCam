// LegalShuffleCam • rtc-core.js
// Configuration WebRTC optimisée pour Coturn

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
  iceTransportPolicy: 'all', // Utilisation de 'all' pour plus de flexibilité
  sdpSemantics: 'unified-plan'
};

// Variable globale pour la connexion WebRTC
let peerConnection;
let remoteId;
let negotiationTimeout;

// Fonction pour démarrer un appel WebRTC
window.startCall = async function(partnerId) {
  remoteId = partnerId;
  console.log('[RTC] Démarrage d\'un appel avec', remoteId);

  try {
    peerConnection = new RTCPeerConnection(rtcConfig);

    // Ajoute les pistes locales
    if (window.currentStream) {
      window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));
    }

    // Gestion des candidats ICE
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        console.log('[RTC] Nouveau candidat ICE :', e.candidate.candidate);
        if (e.candidate.candidate.includes('typ relay')) {
          console.log('[RTC] ✅ Candidat RELAY trouvé !');
        }
        window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
      }
    };

    // Gestion des flux distants
    peerConnection.ontrack = e => {
      console.log('[RTC] Flux distant reçu !');
      if (document.getElementById('remoteVideo')) {
        document.getElementById('remoteVideo').srcObject = e.streams[0];
      }
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { message: "Flux distant reçu." }
      }));
    };

    // Gestion des changements d'état
    peerConnection.onconnectionstatechange = () => {
      console.log('[RTC] État de la connexion:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        window.dispatchEvent(new CustomEvent('rtcConnected', {
          detail: { message: "Connexion WebRTC établie." }
        }));
      } else if (peerConnection.connectionState === 'failed') {
        console.error('[RTC] Échec de la connexion WebRTC.');
        window.dispatchEvent(new CustomEvent('rtcError', {
          detail: { message: "Échec de la connexion WebRTC." }
        }));
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('[RTC] État ICE:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'failed') {
        console.error('[RTC] Échec de la connexion ICE.');
        window.dispatchEvent(new CustomEvent('rtcError', {
          detail: { message: "Échec de la connexion WebRTC. Vérifiez votre réseau." }
        }));
      }
    };

    // Crée une offre
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('[RTC] Offre créée et envoyée à', remoteId);
    window.socket.emit("offer", { to: remoteId, sdp: offer.sdp });

    // Timeout pour éviter les blocages
    negotiationTimeout = setTimeout(() => {
      console.warn('[RTC] Timeout : Négociation WebRTC trop longue.');
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "La connexion a expiré. Réessayez." }
      }));
    }, 10000);

  } catch (err) {
    console.error('[RTC] Erreur lors de la création de l\'offre :', err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur lors de la création de l'offre WebRTC.", error: err }
    }));
  }
};

// Fonction pour gérer une offre reçue
window.handleOffer = async function({ from, sdp }) {
  remoteId = from;
  console.log('[RTC] Offre reçue de', remoteId);

  try {
    peerConnection = new RTCPeerConnection(rtcConfig);

    // Ajoute les pistes locales
    if (window.currentStream) {
      window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));
    }

    // Gestion des candidats ICE
    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        console.log('[RTC] Nouveau candidat ICE :', e.candidate.candidate);
        window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
      }
    };

    // Gestion des flux distants
    peerConnection.ontrack = e => {
      console.log('[RTC] Flux distant reçu !');
      if (document.getElementById('remoteVideo')) {
        document.getElementById('remoteVideo').srcObject = e.streams[0];
      }
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { message: "Flux distant reçu." }
      }));
    };

    // Gestion des changements d'état
    peerConnection.onconnectionstatechange = () => {
      console.log('[RTC] État de la connexion:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('[RTC] État ICE:', peerConnection.iceConnectionState);
    };

    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sdp }));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('[RTC] Réponse créée et envoyée à', remoteId);
    window.socket.emit("answer", { to: remoteId, sdp: answer.sdp });
    clearTimeout(negotiationTimeout);

  } catch (err) {
    console.error('[RTC] Erreur lors de la gestion de l\'offre :', err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur lors de la gestion de l'offre WebRTC.", error: err }
    }));
  }
};

// Fonction pour gérer une réponse reçue
window.handleAnswer = async function({ sdp }) {
  try {
    console.log('[RTC] Réponse reçue.');
    await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sdp }));
    clearTimeout(negotiationTimeout);
  } catch (err) {
    console.error('[RTC] Erreur lors de la gestion de la réponse :', err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur lors de la gestion de la réponse WebRTC.", error: err }
    }));
  }
};

// Fonction pour gérer un candidat ICE reçu
window.handleICECandidate = async function({ candidate }) {
  try {
    console.log('[RTC] Candidat ICE reçu :', candidate);
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.warn('[RTC] Candidat ICE ignoré :', err);
  }
};

// Fonction pour déconnecter WebRTC
window.disconnectWebRTC = function() {
  if (peerConnection) {
    console.log('[RTC] Déconnexion WebRTC.');
    peerConnection.close();
    peerConnection = null;
    remoteId = null;
    clearTimeout(negotiationTimeout);
    window.dispatchEvent(new CustomEvent('rtcDisconnected', {
      detail: { message: "Connexion WebRTC terminée." }
    }));
  }
};

// Fonction pour vérifier l'état de la connexion
window.checkConnectionStatus = function() {
  if (peerConnection) {
    console.log('[RTC] État actuel de la connexion:', peerConnection.connectionState);
    console.log('[RTC] État actuel ICE:', peerConnection.iceConnectionState);
  } else {
    console.log('[RTC] Aucune connexion WebRTC active.');
  }
};