#!/bin/bash
echo "📦 Sauvegarde de rtc-core.js → rtc-core.js.old"
cp public/js/rtc-core.js public/js/rtc-core.js.old

echo "🧱 Création de rtc-core.js (partie 1)"
mkdir -p public/js
cat << 'JS' > public/js/rtc-core.js
// LegalShuffleCam • rtc-core.js (version optimisée avec tampon ICE)
// Gestion centrale des connexions WebRTC, des flux multimédias et des erreurs.

// --- Configuration globale ---
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// --- Variables globales ---
let localStream = null;
let peerConnection = null;
let remoteId = null;
let iceBuffer = [];
let partnerSocketId = null;
let socket = null;
window.lastRTCPartnerId = null;

/**
 * Envoie un candidat ICE au partenaire.
 */
function sendIce(candidate) {
  if (partnerSocketId) {
    socket.emit("ice-candidate", { to: partnerSocketId, candidate });
  } else {
    iceBuffer.push(candidate);
  }
}

/**
 * Vide le tampon ICE si le partenaire est connu.
 */
function flushIceBuffer() {
  if (partnerSocketId && iceBuffer.length > 0) {
    iceBuffer.forEach(c => socket.emit("ice-candidate", { to: partnerSocketId, candidate: c }));
    iceBuffer = [];
  }
}
JS
echo "✅ Partie 1 créée."
