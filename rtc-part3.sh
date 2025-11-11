#!/bin/bash
echo "🧱 Ajout de initSocket() + exports (partie 3)"
cat << 'JS' >> public/js/rtc-core.js

function initSocket() {
  socket = io();
  socket.on("connect", () => {
    console.log(`[RTC] Connecté (id: ${socket.id})`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[RTC] Déconnecté : ${reason}`);
  });

  socket.on("connect_error", (err) => {
    console.error("[RTC] Erreur Socket.IO :", err);
  });

  socket.on("partner", (data) => {
    if (data.id) {
      partnerSocketId = data.id;
      flushIceBuffer();
    }
  });
}

// --- Export des fonctions globales ---
window.initLocalStream = initLocalStream;
window.startCall = startCall;
window.handleOffer = handleOffer;
window.handleAnswer = handleAnswer;
window.handleICECandidate = handleICECandidate;
window.disconnectWebRTC = disconnectWebRTC;
window.initSocket = initSocket;
JS
echo "✅ Partie 3 ajoutée."
