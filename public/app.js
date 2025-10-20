window.connectSocketAndWebRTC = function(localStream) {
  const socket = io('https://legalshufflecam.ovh', {
    transports: ['websocket'],
    secure: true
  });
  window.socket = socket;

  const peerConnection = new RTCPeerConnection();
  window.peerConnection = peerConnection;

  const topBar = document.getElementById('topBar');
  const btnNext = document.getElementById('btnNext');
  const btnReport = document.getElementById('btnReport');
  const remoteVideo = document.getElementById('remoteVideo');

  peerConnection.ontrack = (event) => {
    console.log('[WebRTC] Flux distant reçu', event.streams);
    remoteVideo.srcObject = event.streams[0];
  };

    remoteVideo.srcObject = event.stream;
  };

  remoteVideo.onloadedmetadata = () => {
    console.log('[WebRTC] Vidéo prête à jouer');
    remoteVideo.play();
  };

  socket.on('connect', () => {
    console.log('[Socket.IO] Connecté au serveur :', socket.id);
    socket.emit('ready-for-match');

    socket.on('match-found', async (peerId) => {
      console.log('[LSC] Match trouvé avec :', peerId);
      if (topBar) topBar.textContent = " Connecté à un partenaire";

      localStream.getTracks().forEach(track => {
        console.log('[WebRTC] Ajout track côté émetteur', track);
        peerConnection.addTrack(track, localStream);
      });

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', peerConnection.localDescription);
    });
  });

  socket.on('offer', async (offer) => {
    console.log('[WebRTC] Offer reçue', offer);

    localStream.getTracks().forEach(track => {
      console.log('[WebRTC] Ajout track côté receveur', track);
      peerConnection.addTrack(track, localStream);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', peerConnection.localDescription);
  });

  socket.on('answer', async (answer) => {
    console.log('[WebRTC] Answer reçue', answer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('ice-candidate', async (candidate) => {
    console.log('[WebRTC] ICE candidate reçue', candidate);
    if (peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(candidate);
    }
  });

  socket.on('partner-disconnected', () => {
    console.log('[Socket.IO] Partenaire déconnecté');
    if (topBar) topBar.textContent = "⚠ Partenaire déconnecté. Recherche...";
    window.disconnectWebRTC();
    setTimeout(() => {
      window.connectSocketAndWebRTC(localStream);
    }, 3000);
  });

  socket.on('was-reported', () => {
    console.log('[MODERATION] Vous avez été signalé');
    if (topBar) topBar.textContent = '⚠ Signalé. Recherche...';
    window.nextInterlocutor();
  });

  socket.on('force-disconnect', (reason) => {
    console.log('[MODERATION] Déconnexion forcée :', reason);
    if (reason === 'banned') {
      if (topBar) topBar.textContent = ' Banni pour 24h';
      if (btnNext) btnNext.disabled = true;
      if (btnReport) btnReport.disabled = true;
      window.disconnectWebRTC();
      alert('Vous avez été banni du service pour 24h.');
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Déconnecté :', reason);
    if (topBar) topBar.textContent = " Déconnecté. Reconnexion...";
  });
};

socket.on("partner", (partnerId) => {
  console.log("🧑‍🤝‍🧑 Partenaire reçu :", partnerId);
  if (typeof connectSocketAndWebRTC === "function") connectSocketAndWebRTC(partnerId);
});

// 🔍 Traces WebRTC offreur
console.log("[RTC] Création RTCPeerConnection (offreur)");
peerConnection = new RTCPeerConnection();

localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, localStream);
  console.log("[RTC] Track locale ajoutée :", track.kind);
});

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("[RTC] ICE local (offreur) :", event.candidate);
    socket.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
  }
};

peerConnection.createOffer().then(offer => {
  console.log("[RTC] Offre créée :", offer.sdp);
  return peerConnection.setLocalDescription(offer);
}).then(() => {
  console.log("[RTC] Description locale définie");
  socket.emit("offer", { to: partnerId, sdp: peerConnection.localDescription });
});


// 🔍 Traces WebRTC offreur
console.log("[RTC] Création RTCPeerConnection (offreur)");
peerConnection = new RTCPeerConnection();

localStream.getTracks().forEach(track => {
  peerConnection.addTrack(track, localStream);
  console.log("[RTC] Track locale ajoutée :", track.kind);
});

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("[RTC] ICE local (offreur) :", event.candidate);
    socket.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
  }
};

peerConnection.createOffer().then(offer => {
  console.log("[RTC] Offre créée :", offer.sdp);
  return peerConnection.setLocalDescription(offer);
}).then(() => {
  console.log("[RTC] Description locale définie");
  socket.emit("offer", { to: partnerId, sdp: peerConnection.localDescription });
});


// 🔔 Réception du match et démarrage WebRTC côté caller
socket.on("match", ({ peerId, role }) => {
  console.log("[RTC] Match reçu :", peerId, "rôle :", role);
  if (role !== "caller") return;

  peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[RTC] ICE local :", event.candidate);
      socket.emit("rtc:ice", { to: peerId, candidate: event.candidate });
    }
  };

  peerConnection.createOffer().then(offer => {
    console.log("[RTC] Offre créée :", offer.sdp);
    return peerConnection.setLocalDescription(offer);
  }).then(() => {
    console.log("[RTC] Description locale définie (caller)");
    socket.emit("rtc:offer", { to: peerId, sdp: peerConnection.localDescription });
  }).catch(err => {
    console.error("[RTC] Erreur création d’offre :", err);
  });
});

// 🔔 Réception du match et démarrage WebRTC côté caller
socket.on("match", ({ peerId, role }) => {
  console.log("[RTC] Match reçu :", peerId, "rôle :", role);
  if (role !== "caller") return;

  peerConnection = new RTCPeerConnection();

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[RTC] ICE local :", event.candidate);
      socket.emit("rtc:ice", { to: peerId, candidate: event.candidate });
    }
  };

  peerConnection.createOffer().then(offer => {
    console.log("[RTC] Offre créée :", offer.sdp);
    return peerConnection.setLocalDescription(offer);
  }).then(() => {
    console.log("[RTC] Description locale définie (caller)");
    socket.emit("rtc:offer", { to: peerId, sdp: peerConnection.localDescription });
  }).catch(err => {
    console.error("[RTC] Erreur création d’offre :", err);
  });
});

// 🔍 Vérification visuelle de remoteVideo.srcObject côté caller
setTimeout(() => {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo && remoteVideo.srcObject) {
    console.log("[RTC] ✅ remoteVideo.srcObject actif (caller)");
  } else {
    console.warn("[RTC] ⚠️ remoteVideo.srcObject absent ou null (caller)");
  }
}, 2000);

// 🔍 Vérification côté caller : remoteVideo.srcObject
setTimeout(() => {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo && remoteVideo.srcObject) {
    console.log("[RTC] ✅ remoteVideo.srcObject actif (caller)");
  } else {
    console.warn("[RTC] ⚠️ remoteVideo.srcObject absent ou null (caller)");
  }
}, 2000);

// 🧭 Logger réception socket.on côté caller
(function() {
  const originalOn = socket.on;
  socket.on = function(event, handler) {
    console.log("[RTC] 📥 Réception socket.on (caller) :", event);
    return originalOn.call(this, event, handler);
  };
})();

if (peerConnection) {
  peerConnection.onconnectionstatechange = () => {
    console.log("[RTC] 🔄 État peerConnection :", peerConnection.connectionState);
  };
}


window.getLocalStream = async function() {
  if (window.localStream) return window.localStream;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    window.localStream = stream;
    return stream;
  } catch (err) {
    console.error("[RTC] Erreur caméra :", err.message);
    throw err;
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (window.tf && tf.version && tf.version.tfjs) {
    console.log('[RTC] ✅ tfjs version :', tf.version.tfjs);
  } else {
    console.warn('[RTC] ⚠ tfjs non chargé');
  }

  if (window.__fgBlazeModel && typeof window.__fgBlazeModel.estimateFaces === 'function') {
    console.log('[RTC] ✅ Modèle Blazeface actif via fg-blaze-loader.js');
  } else {
    console.warn('[RTC] ⚠ Modèle Blazeface non détecté');
  }
});

    const visible = faces.length > 0;
    window.faceVisible = visible;
    window.okStreak = visible ? window.okStreak + 1 : 0;

    console.log('[RTC] 🔍 Visage détecté:', visible, '| Streak:', window.okStreak);
  } catch (err) {
    console.error('[RTC] ❌ Erreur estimateFaces:', err);
  }
}, 500);

window.okStreak = 0;
const history = Array(30).fill(0);
const remoteVideo = document.getElementById("remoteVideo");

const tracker = new tracking.ObjectTracker("face");
tracker.setInitialScale(2);
tracker.setStepSize(1.5);
tracker.setEdgesDensity(0.05);

tracking.track("#remoteVideo", tracker);

tracker.on("track", event => {
  const face = event.data[0];
  const visible = !!face;
  window.okStreak = visible ? Math.min(window.okStreak + 1, 30) : Math.max(window.okStreak - 1, 0);
  history.shift(); history.push(window.okStreak >= 15 ? 1 : 0);
  const sum = history.reduce((a, b) => a + b, 0);
  window.faceVisible = sum >= 15;

  console.log("[RTC] 🔍 Visage détecté:", visible, "| Streak:", window.okStreak, "| faceVisible:", window.faceVisible);
});
