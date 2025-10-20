window.connectSocketAndWebRTC = function(localStream) {
  const socket = io('https://legalshufflecam.ovh', {
    transports: ['websocket'],
    secure: true
  });
  window.socket = socket;

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

// 🔍 Vérification côté caller : remoteVideo.srcObject

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


    const visible = faces.length > 0;
    window.faceVisible = visible;
    window.okStreak = visible ? window.okStreak + 1 : 0;

    console.log('[RTC] 🔍 Visage détecté:', visible, '| Streak:', window.okStreak);
  } catch (err) {
    console.error('[RTC] ❌ Erreur estimateFaces:', err);
  }
}, 500);

