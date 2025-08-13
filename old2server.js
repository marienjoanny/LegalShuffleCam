// server.js — HTTPS + Socket.IO + matchmaking + "report" (Signaler)

const express = require('express');
const fs = require('fs');
const https = require('https');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public')); // sert /public (index.html, app.js, etc.)

// ⚠️ Certificat auto-signé attendu dans ./cert (modifie ces chemins si besoin)
const tlsOptions = {
  key:  fs.readFileSync('cert/key.pem'),
  cert: fs.readFileSync('cert/cert.pem'),
};

// Serveur HTTPS + Socket.IO
const server = https.createServer(tlsOptions, app);
const io = new Server(server);

// --- File d’attente & paires -------------------------------------------------
const queue = new Set();     // sockets en attente
const pairs = new Map();     // socketId -> peerId

const inPair    = (id) => pairs.has(id);
const partnerOf = (id) => pairs.get(id);

// Essaie d'apparier tant qu'on a au moins 2 personnes
function match() {
  while (queue.size >= 2) {
    const [a, b] = [...queue].slice(0, 2);
    queue.delete(a); queue.delete(b);
    pairs.set(a, b); pairs.set(b, a);
    io.to(a).emit('match', { peerId: b });
    io.to(b).emit('match', { peerId: a });
  }
}

// Met fin à une pair (et notifie l’autre au besoin)
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

// --- Signaling / File d’attente ----------------------------------------------
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
    queue.delete(socket.id);
    endPair(socket.id);
    queue.add(socket.id);   // refile immédiate
    match();
  });

  // --- WebRTC signaling entre pairs ---
  socket.on('rtc:offer',  ({ to, sdp })       => io.to(to).emit('rtc:offer',  { from: socket.id, sdp }));
  socket.on('rtc:answer', ({ to, sdp })       => io.to(to).emit('rtc:answer', { from: socket.id, sdp }));
  socket.on('rtc:ice',    ({ to, candidate }) => io.to(to).emit('rtc:ice',    { from: socket.id, candidate }));

  // --- Bouton "Signaler" (log simple pour le moment) ---
  socket.on('report', ({ against }) => {
    console.log(`[REPORT] ${socket.id} signale ${against}`);
    // Évolution possible :
    // - Compter les reports par peerId/IP
    // - Si > X reports sur 5 minutes -> kick/ban temporaire
    // - Émettre un événement admin/modération
  });

  // Déconnexion : nettoyage total
  socket.on('disconnect', () => {
    queue.delete(socket.id);
    endPair(socket.id, { notify: true });
  });
});

// --- Lancement ----------------------------------------------------------------
const HOST = '0.0.0.0';
const PORT = 3000;
server.listen(PORT, HOST, () => {
  console.log(`LegalShuffleCam -> https://${HOST}:${PORT}`);
});