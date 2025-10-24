// LegalShuffleCam • rtc-core.js (version optimisée)
// Gestion centrale des connexions WebRTC et des flux multimédias.

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

let localStream = null;
let peerConnection = null;
let remoteId = null;
let socket = null;

function createPeerConnection(stream) {
  if (!stream) {
    console.error("[RTC] Impossible de créer peerConnection : pas de flux local.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Flux local manquant pour WebRTC." }
    }));
    return null;
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);

  stream.getTracks().forEach(track => {
    if (track.kind === 'video' || track.kind === 'audio') {
      pc.addTrack(track, stream);
      console.log(`[RTC] Track ajouté : ${track.kind}`);
    }
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[RTC] Nouveau candidat ICE généré.");
      socket.emit("ice-candidate", { to: remoteId, candidate: event.candidate });
    } else {
      console.log("[RTC] Tous les candidats ICE envoyés.");
    }
  };

  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && event.streams && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      console.log("[RTC] Flux distant reçu et assigné.");
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { stream: event.streams[0] }
      }));
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[RTC] État de la connexion : ${pc.connectionState}`);
    if (pc.connectionState === "failed") {
      window.dispatchEvent(new CustomEvent('rtcFailed', {
        detail: { error: "Échec de la connexion WebRTC." }
      }));
    } else if (pc.connectionState === "connected") {
      window.dispatchEvent(new CustomEvent('rtcConnected', {
        detail: { message: "Connexion WebRTC établie." }
      }));
    }
  };

  return pc;
}

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

async function startCall(partnerId) {
  try {
    if (!localStream) {
      localStream = await initLocalStream();
      document.getElementById("localVideo").srcObject = localStream;
    }

    remoteId = partnerId;
    peerConnection = createPeerConnection(localStream);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { to: partnerId, sdp: offer });
    console.log("[RTC] Offre créée et envoyée.");
  } catch (err) {
    console.error("[RTC] Erreur lors de la création de l'offre :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de la création de l'offre WebRTC.", error: err }
    }));
  }
}

async function handleOffer(data) {
  try {
    if (!localStream) {
      localStream = await initLocalStream();
      document.getElementById("localVideo").srcObject = localStream;
    }

    remoteId = data.from;
    peerConnection = createPeerConnection(localStream);

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { to: remoteId, sdp: answer });
    console.log("[RTC] Réponse créée et envoyée.");
  } catch (err) {
    console.error("[RTC] Erreur lors de la gestion de l'offre :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de la gestion de l'offre WebRTC.", error: err }
    }));
  }
}

async function handleAnswer(data) {
  try {
    if (!peerConnection) {
      throw new Error("Aucune peerConnection active pour appliquer la réponse.");
    }
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
    console.log("[RTC] Réponse appliquée avec succès.");
  } catch (err) {
    console.error("[RTC] Erreur lors de l'application de la réponse :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de l'application de la réponse WebRTC.", error: err }
    }));
  }
}

async function handleICECandidate(data) {
  try {
    if (!peerConnection) {
      throw new Error("Aucune peerConnection active pour ajouter le candidat ICE.");
    }
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    console.log("[RTC] Candidat ICE ajouté avec succès.");
  } catch (err) {
    console.error("[RTC] Erreur lors de l'ajout du candidat ICE :", err);
  }
}

function disconnectWebRTC() {
  if (peerConnection) {
    peerConnection.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    peerConnection.close();
    peerConnection = null;
    console.log("[RTC] Connexion WebRTC fermée et ressources libérées.");
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    console.log("[RTC] Flux local arrêté.");
  }

  window.dispatchEvent(new CustomEvent('rtcDisconnected', {
    detail: { message: "Déconnexion WebRTC effectuée." }
  }));
}

function initSocket() {
  socket = io();
  socket.on("connect", () => {
    console.log("[RTC] Connecté au serveur Socket.IO.");
  });

  socket.on("disconnect", () => {
    console.log("[RTC] Déconnecté du serveur Socket.IO.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Déconnexion du serveur Socket.IO." }
    }));
  });

  socket.on("partner", ({ id }) => startCall(id));
  socket.on("offer", handleOffer);
  socket.on("answer", handleAnswer);
  socket.on("ice-candidate", handleICECandidate);
}

window.initLocalStream = initLocalStream;
window.startCall = startCall;
window.disconnectWebRTC = disconnectWebRTC;
window.initSocket = initSocket;
