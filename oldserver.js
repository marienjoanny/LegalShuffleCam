// server.js — HTTPS + Socket.IO + matchmaking instantané
const express = require('express');
const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public'));

// Certificat auto-signé (généré dans ./cert)
const tlsOptions = {
  key:  fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem'),
};

// Serveur HTTPS + Socket.IO
const server = https.createServer(tlsOptions, app);
const io = new Server(server);

// File d’attente + paires
const queue = new Set();       // sockets en attente
const pairs = new Map();       // socketId -> peerId

// Utilitaires
const inPair = (id) => pairs.has(id);
const partnerOf = (id) => pairs.get(id);

function match() {
  // Essaie d'apparier tant qu'on a au moins 2 personnes
  while (queue.size >= 2) {
    const [a, b] = [...queue].slice(0, 2);
    queue.delete(a); queue.delete(b);
    pairs.set(a, b); pairs.set(b, a);
    io.to(a).emit('match', { peerId: b });
    io.to(b).emit('match', { peerId: a });
  }
}

function endPair(id, { notify = true } = {}) {
  const other = partnerOf(id);
  if (!other) return;
  pairs.delete(id);
  pairs.delete(other);
  if (notify) {
    io.to(other).emit('ended');
    io.to(id).emit('ended');
  }
}

io.on('connection', (socket) => {
  // Rejoint la file (idempotent)
  socket.on('queue:join', () => {
    if (inPair(socket.id)) return;   // déjà en pair
    queue.add(socket.id);
    match();
  });

  // Quitte la file / coupe la session en cours
  socket.on('queue:leave', () => {
    queue.delete(socket.id);
    endPair(socket.id);
  });

  // Bouton "Suivant" : coupe la pair actuelle puis se remet en file
  socket.on('next', () => {
    queue.delete(socket.id);   // au cas où
    endPair(socket.id);
    // Refile immédiate + rematch
    queue.add(socket.id);
    match();
  });

  // Signaling WebRTC
  socket.on('rtc:offer',  ({ to, sdp }) => io.to(to).emit('rtc:offer',  { from: socket.id, sdp }));
  socket.on('rtc:answer', ({ to, sdp }) => io.to(to).emit('rtc:answer', { from: socket.id, sdp }));
  socket.on('rtc:ice',    ({ to, candidate }) => io.to(to).emit('rtc:ice', { from: socket.id, candidate }));

  // Déconnexion : nettoyage total
  socket.on('disconnect', () => {
    queue.delete(socket.id);
    endPair(socket.id, { notify: true });
  });
});

const HOST = '0.0.0.0';
const PORT = 3000;
server.listen(PORT, HOST, () => {
  console.log(`LegalShuffleCam -> https://${HOST}:${PORT}`);
});