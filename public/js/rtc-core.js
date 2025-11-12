// LegalShuffleCam • rtc-core.js (version finale optimisée pour mobile)
// Gestion complète de WebRTC avec :
// - Filtrage des codecs (exclusion AV1)
// - Tampon ICE robuste pour mobile
// - Logs détaillés pour le débogage
// - Gestion des erreurs et reconnexions

// --- Configuration WebRTC ---
const RTC_CONFIG = {
  iceServers: [
  { urls: 'turns:legalshufflecam.ovh:5349?transport=tcp', username: 'webrtc', credential: 'secret' },
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
{
  urls: 'turns:legalshufflecam.ovh:5349',
  username: 'gandalfshuffle@webRTC',
  credential: 'd6e1ef7a83f7f116ea305ae0191c36945d44d5f0'
}
  ],
  sdpSemantics: 'unified-plan'
};

// --- Variables globales ---
let localStream = null;
let peerConnection = null;
let remoteId = null;
let socket = null;
let iceBuffer = [];          // Tampon pour les candidats ICE
let partnerSocketId = null; // ID du partenaire pour l'envoi des ICE
let iceSentCount = 0;        // Compteur de candidats envoyés
let iceBufferedCount = 0;    // Compteur de candidats bufferisés
let lastIceCandidateTime = 0; // Timestamp du dernier candidat ICE

// --- Filtrage du SDP (exclusion AV1, priorité VP8) ---
function filterSDP(sdp) {
  if (!sdp) return sdp;

  // 1. Supprime les lignes AV1 (non supporté sur certains mobiles)
  let filteredSDP = sdp
    .replace(/a=rtpmap:(\d+) AV1\/90000[\s\S]*?(?=\r\n|$)/g, '')
    .replace(/a=fmtp:(\d+) apt=\1\r\n/g, '')
    .replace(/a=rtcp-fb:(\d+) ccm fir\r\n/g, '');

  // 2. Donne la priorité à VP8 (meilleur support mobile)
  filteredSDP = filteredSDP.replace(
    /(a=rtpmap:(\d+) VP8\/90000)/g,
    'a=rtpmap:$2 VP8/90000\r\n' +
    'a=fmtp:$2 profile-level-id=0;x-google-start-bitrate=1000'
  );

  // 3. Limite les codecs audio à Opus (meilleur support)
  filteredSDP = filteredSDP.replace(
    /(m=audio.*\r\n)(?!.*opus)/g,
    '$1a=rtpmap:111 opus/48000/2\r\n' +
    'a=fmtp:111 minptime=10;useinbandfec=1\r\n' +
    'a=rtcp-fb:111 transport-cc\r\n'
  );

  return filteredSDP;
}

// --- Gestion des candidats ICE ---
function sendIce(candidate) {
  if (!candidate) {
    console.warn("[RTC-ICE] Candidat ICE invalide ignoré.");
    return;
  }

  lastIceCandidateTime = Date.now();

  if (partnerSocketId) {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
    iceSentCount++;
    console.log(`[RTC-ICE] ✅ Candidat ICE envoyé à ${partnerSocketId} (total: ${iceSentCount})`);
  } else {
    iceBuffer.push(candidate);
    iceBufferedCount++;
    console.log(`[RTC-ICE] ⏳ Candidat ICE bufferisé (total: ${iceBufferedCount}, tampon: ${iceBuffer.length})`);
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
  iceBuffer = [];
  iceBufferedCount = 0;
}

// --- Initialisation du flux local ---
async function initLocalStream() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
        facingMode: 'user',
        // Force VP8 sur mobile (meilleur support)
        codec: 'vp8'
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        // Force Opus (meilleur codec audio pour WebRTC)
        codec: 'opus'
      }
    });

    localStream = stream;
    console.log("[RTC] 🎥 Flux local prêt (VP8/Opus).");
    return stream;
  } catch (err) {
    console.error("[RTC] ❌ Erreur caméra/micro :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Accès caméra/micro impossible.", error: err }
    }));
    throw err;
  }
}

// --- Création de la connexion WebRTC ---
function createPeerConnection(stream) {
  if (!stream) {
    console.error("[RTC] ❌ Flux local manquant.");
    return null;
  }

  const pc = new RTCPeerConnection(RTC_CONFIG);

  // Ajoute les tracks locaux
  stream.getTracks().forEach(track => {
    if (track.kind === 'video') {
      console.log(`[RTC] 📹 Track vidéo ajouté (${track.id}, ${track.kind}).`);
    } else if (track.kind === 'audio') {
      console.log(`[RTC] 🎤 Track audio ajouté (${track.id}, ${track.kind}).`);
    }
    pc.addTrack(track, stream);
  });

  // Gestion des candidats ICE
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendIce(event.candidate);
    } else {
      console.log("[RTC-ICE] 🏁 Tous les candidats ICE générés.");
    }
  };

  // Gestion des tracks distants
  pc.ontrack = (event) => {
    const remoteVideo = document.getElementById("remoteVideo");
    if (!remoteVideo) {
      console.error("[RTC] ❌ Élément remoteVideo introuvable.");
      return;
    }

    const stream = event.streams?.[0] || new MediaStream([event.track]);
    remoteVideo.srcObject = stream;

    // Contourne les restrictions autoplay sur mobile
    const playPromise = remoteVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        console.warn("[RTC] ⚠ Lecture bloquée par autoplay :", err);
        // Solution de contournement pour mobile
        remoteVideo.muted = true;
        remoteVideo.play().catch(() => {});
      });
    }

    console.log("[RTC] 🎥 Flux distant attaché.", {
      readyState: remoteVideo.readyState,
      trackKind: event.track.kind,
      codec: event.track.getSettings().codec || 'inconnu'
    });

    // Écoute les changements d'état
    remoteVideo.onloadedmetadata = () => {
      console.log("[RTC] 📡 Métadonnées chargées. État :", remoteVideo.readyState);
    };
  };

  // Gestion des erreurs
  pc.oniceconnectionstatechange = () => {
    console.log(`[RTC] 🔄 État ICE : ${pc.iceConnectionState}`);
    if (pc.iceConnectionState === 'failed') {
      console.error("[RTC] ❌ Échec de la connexion ICE.");
      window.dispatchEvent(new CustomEvent('rtcFailed'));
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`[RTC] 🔄 État connexion : ${pc.connectionState}`);
    if (pc.connectionState === 'connected') {
      console.log("[RTC] ✅ Connexion WebRTC établie.");
      window.dispatchEvent(new CustomEvent('rtcConnected'));
    } else if (pc.connectionState === 'failed') {
      console.error("[RTC] ❌ Échec de la connexion WebRTC.");
      window.dispatchEvent(new CustomEvent('rtcFailed'));
    }
  };

  return pc;
}

// --- Appel sortant (offer) ---
async function startCall(partnerId) {
  console.log(`[RTC] 📞 Appel vers ${partnerId}`);
  if (!partnerId || typeof partnerId !== 'string') {
    console.error("[RTC] ❌ partnerId invalide :", partnerId);
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

    // Vidage du tampon ICE si des candidats étaient en attente
    if (iceBuffer.length > 0) {
      console.log(`[RTC-ICE] 📤 Vidage du tampon ICE (${iceBuffer.length} candidats).`);
      flushIceBuffer();
    }

    peerConnection = createPeerConnection(localStream);
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    // Filtrage du SDP pour exclure AV1 et prioriser VP8
    offer.sdp = filterSDP(offer.sdp);
    await peerConnection.setLocalDescription(offer);

    console.log(`[RTC] 📤 Offre envoyée à ${partnerId} (codecs: VP8/Opus).`);
    socket.emit("offer", { to: partnerId, sdp: offer });
  } catch (err) {
    console.error("[RTC] ❌ Erreur startCall :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de l'appel sortant.", error: err }
    }));
  }
}

// --- Réception d'une offre (answer) ---
async function handleOffer(data) {
  if (!data?.sdp || !data?.from) {
    console.error("[RTC] ❌ Données d'offre invalides :", data);
    return;
  }

  try {
    if (!localStream) {
      localStream = await initLocalStream();
      document.getElementById("localVideo").srcObject = localStream;
    }

    remoteId = data.from;
    partnerSocketId = data.from;
    window.lastRTCPartnerId = data.from;

    // Vidage du tampon ICE si des candidats étaient en attente
    if (iceBuffer.length > 0) {
      console.log(`[RTC-ICE] 📤 Vidage du tampon ICE (${iceBuffer.length} candidats).`);
      flushIceBuffer();
    }

    peerConnection = createPeerConnection(localStream);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));

    // Log des codecs négociés
    peerConnection.getReceivers().forEach(receiver => {
      if (receiver.track) {
        console.log(`[RTC] 📡 Codec négocié (${receiver.track.kind}):`,
                    receiver.track.getSettings().codec || 'inconnu');
      }
    });

    const answer = await peerConnection.createAnswer();
    answer.sdp = filterSDP(answer.sdp);
    await peerConnection.setLocalDescription(answer);

    console.log(`[RTC] 📤 Réponse envoyée à ${data.from} (VP8/Opus).`);
    socket.emit("answer", { to: data.from, sdp: answer });
  } catch (err) {
    console.error("[RTC] ❌ Erreur handleOffer :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de la réponse WebRTC.", error: err }
    }));
  }
}

// --- Réception d'une réponse (answer) ---
async function handleAnswer(data) {
  if (!data?.sdp || !peerConnection) {
    console.error("[RTC] ❌ Données de réponse invalides :", data);
    return;
  }

  try {
    // Filtrage du SDP avant application
    const filteredSDP = filterSDP(data.sdp);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(filteredSDP));

    // Log des codecs négociés
    peerConnection.getReceivers().forEach(receiver => {
      if (receiver.track) {
        console.log(`[RTC] 📡 Codec final (${receiver.track.kind}):`,
                    receiver.track.getSettings().codec || 'inconnu');
      }
    });
  } catch (err) {
    console.error("[RTC] ❌ Erreur handleAnswer :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Échec de l'application de la réponse.", error: err }
    }));
  }
}

// --- Réception d'un candidat ICE ---
async function handleICECandidate(data) {
  if (!data?.candidate || !peerConnection) {
    console.warn("[RTC] ⚠ Candidat ICE invalide ou peerConnection absente :", data);
    return;
  }

  try {
    await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    console.log("[RTC] 🏗 Candidat ICE ajouté avec succès.");
  } catch (err) {
    console.error("[RTC] ❌ Erreur ajout candidat ICE :", err);
  }
}

// --- Déconnexion WebRTC ---
function disconnectWebRTC() {
  if (peerConnection) {
    peerConnection.getSenders().forEach(sender => {
      if (sender.track) sender.track.stop();
    });
    peerConnection.close();
    peerConnection = null;
    console.log("[RTC] 🔌 Connexion WebRTC fermée.");
  }

  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
    console.log("[RTC] 🎥 Flux local arrêté.");
  }

  remoteId = null;
  partnerSocketId = null;
  iceBuffer = [];
  iceSentCount = 0;
  iceBufferedCount = 0;

  window.dispatchEvent(new CustomEvent('rtcDisconnected'));
}

// --- Écouteur pour l'événement "partner" ---
function setupPartnerListener() {
  socket.on("partner", (data) => {
    if (!data?.id) {
      console.error("[RTC] ❌ Données partenaire invalides :", data);
      return;
    }

    partnerSocketId = data.id;
    remoteId = data.id;
    window.lastRTCPartnerId = data.id;

    console.log(`[RTC] 🤝 Partenaire reçu : ${partnerSocketId}`);

    // Vidage du tampon ICE si des candidats étaient en attente
    if (iceBuffer.length > 0) {
      console.log(`[RTC-ICE] 📤 Vidage du tampon ICE (${iceBuffer.length} candidats).`);
      flushIceBuffer();
    } else {
      console.log("[RTC-ICE] 🗑 Tampon ICE vide, aucun candidat à envoyer.");
    }
  });
}

// --- Initialisation Socket.IO ---
function initSocket() {
  socket = io();

  socket.on("connect", () => {
    console.log(`[SOCKET] ✅ Connecté (id: ${socket.id}).`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[SOCKET] ❌ Déconnecté (raison: ${reason}).`);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: `Déconnecté : ${reason}` }
    }));
  });

  socket.on("connect_error", (err) => {
    console.error("[SOCKET] ⚠ Erreur de connexion :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur Socket.IO", error: err }
    }));
  });

  // Configuration des écouteurs
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
