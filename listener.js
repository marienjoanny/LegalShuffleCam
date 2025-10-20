const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs'); 

// ----------------------------------------------------
// 🎯 Structures de Données Globales pour Matchmaking 🎯
// ----------------------------------------------------
let queue = [];       // File d'attente des sockets
let pairs = new Map(); // Map: socket.id -> peer.id

console.log(' Wrapper: loading ./server …');
const srvModule = require('./server');
const app = srvModule?.app || srvModule?.default || srvModule;

if (typeof app !== 'function') {
  console.error('❌ server.js n’a pas exporté une app Express valide');
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, '0.0.0.0', () => {
  // Ligne corrigée : Suppression des backslashes inutiles
  console.log(`✅ Wrapper: listening on http://0.0.0.0:${PORT}`);
});

// ----------------------------------------------------
// 🎯 Gestion des Connexions et des Événements 🎯
// ----------------------------------------------------
io.on('connection', (socket) => {
  const ip = maskIp(socket.handshake.address || 'unknown');
  console.log(' OPEN ', socket.id, ip);

  // Événement appelé par btnJoin (première connexion)
  socket.on('queue:join', () => {
    leaveCurrentPair(socket);
    enqueue(socket);
    tryMatch();
  });
  
  // Événement appelé par btnLeave
  socket.on('queue:leave', () => {
    leaveCurrentPair(socket);
    logModeration('queue_left', ip);
  });
  
  // Événement appelé par btnNext (Étape 3)
  socket.on("next", () => {
    if (isBanned(ip)) {
      socket.emit("moderation:blocked", { reason: "banned" });
      logModeration("next_blocked", ip, "ban active");
      return;
    }
    leaveCurrentPair(socket);
    enqueue(socket);
    tryMatch();
    logModeration("next_allowed", ip);
    socket.emit("next_ack");
  });
  
  // Événements WebRTC pour la signalisation
  socket.on('rtc:offer', ({ to, sdp }) => io.to(to).emit('rtc:offer', { from: socket.id, sdp }));
  socket.on('rtc:answer', ({ to, sdp }) => io.to(to).emit('rtc:answer', { sdp }));
  socket.on('rtc:ice', ({ to, candidate }) => io.to(to).emit('rtc:ice', { candidate }));
  
  // Rapport (simplifié)
  socket.on('report', ({ against }) => {
    logModeration('user_reported', ip, `Against: ${maskIp(io.sockets.sockets.get(against)?.handshake.address || against)}`);
  });

  socket.on('disconnect', () => {
    console.log(' CLOSE ', socket.id);
    leaveCurrentPair(socket); 
  });
});

// ----------------------------------------------------
// 🧩 Implémentation des Fonctions de Matchmaking 🧩
// ----------------------------------------------------

function maskIp(ip) {
  // RGPD : anonymise l'IP en /24
  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.') + '.0';
  }
  return ip;
}

function leaveCurrentPair(socket) {
  const peerId = pairs.get(socket.id);
  
  if (peerId) {
    const peerSocket = io.sockets.sockets.get(peerId);
    if (peerSocket) {
      peerSocket.emit('ended'); // Signale au client distant que la session est terminée
      pairs.delete(peerId);     
      logModeration('session_ended', maskIp(peerSocket.handshake.address));
    }
    pairs.delete(socket.id);  
    logModeration('session_left', maskIp(socket.handshake.address));
  }
  
  // Retirer de la file d'attente
  queue = queue.filter(s => s.id !== socket.id);
}

function enqueue(socket) {
  if (!queue.some(s => s.id === socket.id)) {
    queue.push(socket);
    logModeration('queue_joined', maskIp(socket.handshake.address), `Size: ${queue.length}`);
    socket.emit('status:waiting', { queueSize: queue.length }); 
  }
}

function tryMatch() {
  if (queue.length >= 2) {
    const socketA = queue.shift();
    const socketB = queue.shift();

    pairs.set(socketA.id, socketB.id);
    pairs.set(socketB.id, socketA.id);

    // Démarrage WebRTC: A est 'caller', B est 'callee'
    socketA.emit('match', { peerId: socketB.id, role: 'caller' });
    socketB.emit('match', { peerId: socketA.id, role: 'callee' });

    logModeration('match_made', maskIp(socketA.handshake.address), `Peer: ${maskIp(socketB.handshake.address)}`);
    
    // Essayer de matcher le reste de la file
    tryMatch(); 
  }
}

// ----------------------------------------------------
// 👮 Stubs de Modération et Logging
// ----------------------------------------------------

function isBanned(ip) {
  return false; // **À implémenter**
}

function logModeration(action, ip, note = '') {
  const line = `${new Date().toISOString()} ${action} ${ip} ${note}\n`;
  try {
      fs.appendFileSync('/var/log/legalshufflecam/moderation.log', line);
  } catch (e) {
      console.error('Error writing log:', e.message);
  }
}
const waitingUsers = [];

io.on("connection", (socket) => {
  console.log("[RTC] Connexion :", socket.id);

  // 🔁 File d’attente
  waitingUsers.push(socket.id);
  if (waitingUsers.length >= 2) {
    const [a, b] = waitingUsers.splice(0, 2);
    io.to(a).emit("partner", { id: b });
    io.to(b).emit("partner", { id: a });
    console.log("[RTC] Match :", a, "<>", b);
  }

  socket.on("disconnect", () => {
    const i = waitingUsers.indexOf(socket.id);
    if (i !== -1) waitingUsers.splice(i, 1);
    console.log("[RTC] Déconnexion :", socket.id);
  });
});

socket.on("ice-candidate", ({ from, candidate }) => {
  console.log("📨 ICE reçu :", candidate);
  if (peerConnection) peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// 🔍 Traces WebRTC
console.log("[RTC] Création RTCPeerConnection");
peerConnection = new RTCPeerConnection();

peerConnection.ontrack = (event) => {
  console.log("[RTC] Track reçu :", event.track.kind);
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo && event.streams[0]) {
    remoteVideo.srcObject = event.streams[0];
    console.log("[RTC] remoteVideo.srcObject assigné");
  }
};

peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("[RTC] ICE local :", event.candidate);
    socket.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
  }
};


// 🔍 Réception de l'offre SDP
socket.on("offer", ({ from, sdp }) => {
  console.log("[RTC] Offre reçue de", from);
  peerConnection = new RTCPeerConnection();

  peerConnection.ontrack = (event) => {
    console.log("[RTC] Track reçue :", event.track.kind);
    const remoteVideo = document.getElementById("remoteVideo");
    if (remoteVideo && event.streams[0]) {
      remoteVideo.srcObject = event.streams[0];
      console.log("[RTC] remoteVideo.srcObject assigné");
    }
  };

  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
    console.log("[RTC] Description distante définie");
    return peerConnection.createAnswer();
  }).then(answer => {
    console.log("[RTC] Réponse créée :", answer.sdp);
    return peerConnection.setLocalDescription(answer);
  }).then(() => {
    console.log("[RTC] Description locale définie (récepteur)");
    socket.emit("answer", { to: from, sdp: peerConnection.localDescription });
  });
});

// 🔍 Vérification visuelle de remoteVideo.srcObject côté callee
setTimeout(() => {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo && remoteVideo.srcObject) {
    console.log("[RTC] ✅ remoteVideo.srcObject actif (callee)");
  } else {
    console.warn("[RTC] ⚠️ remoteVideo.srcObject absent ou null (callee)");
  }
}, 2000);

// 🔔 Réception de l'offre et démarrage WebRTC côté callee
socket.on("offer", ({ from, sdp }) => {
  console.log("[RTC] Offre reçue de", from);
  peerConnection = new RTCPeerConnection();

  peerConnection.ontrack = (event) => {
    console.log("[RTC] Flux reçu côté callee");
    document.getElementById("remoteVideo").srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[RTC] ICE local (callee)", event.candidate);
      socket.emit("rtc:ice", { to: from, candidate: event.candidate });
    }
  };

  peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
    return peerConnection.createAnswer();
  }).then(answer => {
    return peerConnection.setLocalDescription(answer);
  }).then(() => {
    console.log("[RTC] Réponse créée et envoyée");
    socket.emit("rtc:answer", { to: from, sdp: peerConnection.localDescription });
  }).catch(err => {
    console.error("[RTC] Erreur côté callee :", err);
  });
});

// 🔄 Réception des ICE distants
socket.on("ice-candidate", ({ candidate }) => {
  console.log("[RTC] ICE distant reçu (callee)", candidate);
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// 🔍 Vérification côté callee : remoteVideo.srcObject
setTimeout(() => {
  const remoteVideo = document.getElementById("remoteVideo");
  if (remoteVideo && remoteVideo.srcObject) {
    console.log("[RTC] ✅ remoteVideo.srcObject actif (callee)");
  } else {
    console.warn("[RTC] ⚠️ remoteVideo.srcObject absent ou null (callee)");
  }
}, 2000);

// 🧭 Logger réception socket.on côté callee
(function() {
  const originalOn = socket.on;
  socket.on = function(event, handler) {
    console.log("[RTC] 📥 Réception socket.on (callee) :", event);
    return originalOn.call(this, event, handler);
  };
})();

if (peerConnection) {
  peerConnection.onconnectionstatechange = () => {
    console.log("[RTC] 🔄 État peerConnection :", peerConnection.connectionState);
  };
}

