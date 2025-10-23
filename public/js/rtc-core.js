let localStream;
let peerConnection;
let remoteId;
const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

async function startLocalVideo() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  document.getElementById('localVideo').srcObject = localStream;
  console.log('[RTC] Flux local démarré');
}

if (!localStream) {  console.warn("[RTC] ⚠ createPeerConnection appelé sans flux local");  return;}
  peerConnection = new RTCPeerConnection(config);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
    console.log('[RTC] Flux distant reçu');
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('icecandidate', { candidate: event.candidate, to: remoteId });
      console.log('[RTC] ICE locale envoyée');
    }
  };
}

socket.on('offer', async ({ sdp, from }) => {
  remoteId = from;
if (!localStream) {  console.warn("[RTC] ⚠ createPeerConnection appelé sans flux local");  return;}
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', { sdp: answer, to: remoteId });
  console.log('[RTC] Answer envoyée');
});

socket.on('answer', async ({ sdp }) => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  console.log('[RTC] Answer reçue et appliquée');
});

socket.on('icecandidate', async ({ candidate }) => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  console.log('[RTC] ICE distante ajoutée');
});

async function initiateCall(targetId) {
  remoteId = targetId;
if (!localStream) {  console.warn("[RTC] ⚠ createPeerConnection appelé sans flux local");  return;}
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', { sdp: offer, to: remoteId });
  console.log('[RTC] Offer envoyée');
}

function disconnectWebRTC() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    console.log('[RTC] Connexion WebRTC fermée');
  }
}

// 🔗 Réception ID partenaire
socket.on('partner', ({ id }) => {
  initiateCall(id);
});

// 🎥 Initialisation du flux local avec fallback
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
  console.log("[RTC] ✅ localStream prêt :", localStream);
    console.log("[RTC] 🎥 Flux local initialisé :", localStream);
    document.getElementById("localVideo").srcObject = stream;
  })
  .catch(err => {
    console.error("[RTC] ❌ Erreur getUserMedia :", err);
  });


// 🎯 Remplacement de onaddstream par ontrack
peerConnection.ontrack = (event) => {
  console.log("[RTC] 📡 Track reçu :", event.streams[0]);
  document.getElementById("remoteVideo").srcObject = event.streams[0];
};


// 🧪 Vérification de remoteVideo.srcObject
const remoteVideo = document.getElementById("remoteVideo");
if (remoteVideo && remoteVideo.srcObject) {
  console.log("[RTC] ✅ remoteVideo.srcObject actif :", remoteVideo.srcObject);
} else {
  console.warn("[RTC] ⚠ remoteVideo.srcObject absent ou null");
}


// 🎯 Remplacement de onaddstream par ontrack
peerConnection.ontrack = (event) => {
  console.log("[RTC] 📡 Track reçu :", event.streams[0]);
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo) {
    remoteVideo.srcObject = event.streams[0];
    console.log("[RTC] 🎥 remoteVideo.srcObject défini :", remoteVideo.srcObject);
  } else {
    console.warn("[RTC] ⚠ remoteVideo introuvable");
  }
};


// 🎥 Initialisation du flux local + création peerConnection
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
  console.log("[RTC] ✅ localStream prêt :", localStream);
    console.log("[RTC] ✅ Flux local prêt :", localStream);
    document.getElementById("localVideo").srcObject = stream;

    // 🔄 Création de la peerConnection après flux prêt
  })
  .catch(err => {
    console.error("[RTC] ❌ Erreur getUserMedia :", err);
  });


// 🔒 Traçage de fermeture peerConnection
if (peerConnection) {
  peerConnection.onconnectionstatechange = () => {
    console.log("[RTC] 🔄 État peerConnection :", peerConnection.connectionState);
    if (peerConnection.connectionState === "closed") {
      console.warn("[RTC] ❌ Connexion WebRTC fermée");
    }
  };
}


// 🧪 Vérification des flux vidéo côté client
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

if (localVideo && localVideo.srcObject) {
  console.log("[RTC] ✅ Flux local actif :", localVideo.srcObject);
} else {
  console.warn("[RTC] ⚠ Flux local absent ou null");
}

if (remoteVideo && remoteVideo.srcObject) {
  console.log("[RTC] ✅ Flux distant actif :", remoteVideo.srcObject);
} else {
  console.warn("[RTC] ⚠ Flux distant absent ou null");
}


// 🔊 Vérification du flux audio côté client
if (localStream && typeof localStream.getAudioTracks === "function") {
  const audioTracks = localStream.getAudioTracks();
  if (audioTracks.length > 0) {
    console.log("[RTC] ✅ Flux audio actif :", audioTracks);
  } else {
    console.warn("[RTC] ⚠ Aucun flux audio détecté");
  }
} else {
  console.error("[RTC] ❌ localStream audio non accessible");
}


// 🧩 Traçage SDP et ICE
if (peerConnection) {
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[RTC] ❄ ICE candidate reçu :", event.candidate);
    } else {
      console.log("[RTC] ✅ Fin des ICE candidates");
    }
  };

  const originalSetLocalDescription = peerConnection.setLocalDescription;
  peerConnection.setLocalDescription = async function(desc) {
    console.log("[RTC] 📤 setLocalDescription appelée :", desc);
    return originalSetLocalDescription.call(this, desc);
  };

  const originalSetRemoteDescription = peerConnection.setRemoteDescription;
  peerConnection.setRemoteDescription = async function(desc) {
    console.log("[RTC] 📥 setRemoteDescription appelée :", desc);
    return originalSetRemoteDescription.call(this, desc);
  };
}


// 🎥 Initialisation du flux local + création peerConnection
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
  console.log("[RTC] ✅ localStream prêt :", localStream);
    console.log("[RTC] ✅ Flux local prêt :", localStream);
    document.getElementById("localVideo").srcObject = stream;

    // 🔄 Création de la peerConnection après flux prêt
if (!localStream) {  console.warn('[RTC] ⚠ createPeerConnection appelé sans flux local');  return;}
    createPeerConnection();
  })
  .catch(err => {
    console.error("[RTC] ❌ Erreur getUserMedia :", err);
  });


// 🧪 Vérification de disponibilité du flux avant opérations
if (!localStream) {
  console.error("[RTC] ❌ Tentative d’accès à getTracks/addTrack sans flux local");
  return;
}

// Exemple d’usage sécurisé
const tracks = localStream.getTracks();
tracks.forEach(track => {
  peerConnection.addTrack(track, localStream);
  console.log("[RTC] 🎯 Track ajoutée :", track.kind);
});

