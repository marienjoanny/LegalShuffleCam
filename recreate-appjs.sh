#!/bin/bash

echo "🔧 Recréation de public/app.js..."

cat <<'JS' > /var/www/legalshufflecam/public/app.js
window.connectSocketAndWebRTC = function(localStream) {
  const socket = io();
  const peerConnection = new RTCPeerConnection();
  const topBar = document.getElementById('topBar');
  const btnNext = document.getElementById('btnNext');
  const btnReport = document.getElementById('btnReport');

  // 🔌 Connexion Socket.IO
  socket.on('connect', () => {
    console.log('[Socket.IO] Connecté au serveur :', socket.id);
    socket.emit('ready-for-match');

    socket.on('match-found', async (peerId) => {
      console.log('[LSC] Match trouvé avec :', peerId);
      if (topBar) topBar.textContent = "🟢 Connecté à un partenaire";

      // Envoie l'offre WebRTC
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('offer', peerConnection.localDescription);
    });
  });

  // Réception de l'offre
  socket.on('offer', async (offer) => {
    console.log('[WebRTC] Offer reçue');
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', peerConnection.localDescription);
  });

  // Réception de l'answer
  socket.on('answer', async (answer) => {
    console.log('[WebRTC] Answer reçue');
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  // Réception ICE
  socket.on('ice-candidate', async (candidate) => {
    if (peerConnection.remoteDescription) {
      await peerConnection.addIceCandidate(candidate);
    }
  });

  // Déconnexion partenaire
  socket.on('partner-disconnected', () => {
    console.log('[Socket.IO] Partenaire déconnecté');
    if (topBar) topBar.textContent = "⚠ Partenaire déconnecté. Recherche...";
    window.disconnectWebRTC();
    setTimeout(() => {
      window.connectSocketAndWebRTC(localStream);
    }, 3000);
  });

  // Modération
  socket.on('was-reported', () => {
    console.log('[MODERATION] Vous avez été signalé');
    if (topBar) topBar.textContent = '⚠ Signalé. Recherche...';
    window.nextInterlocutor();
  });

  socket.on('force-disconnect', (reason) => {
    console.log('[MODERATION] Déconnexion forcée :', reason);
    if (reason === 'banned') {
      if (topBar) topBar.textContent = '🚫 Banni pour 24h';
      if (btnNext) btnNext.disabled = true;
      if (btnReport) btnReport.disabled = true;
      window.disconnectWebRTC();
      alert('Vous avez été banni du service pour 24h.');
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket.IO] Déconnecté :', reason);
    if (topBar) topBar.textContent = "🔌 Déconnecté. Reconnexion...";
  });
};
JS

chmod +x /var/www/legalshufflecam/public/app.js
echo "✅ public/app.js recréé et marqué comme exécutable"
