// server.js — Socket.IO + matchmaking + logs détaillés
// Lance en HTTPS si cert présents, sinon fallback HTTP.

const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');

const app = express();
app.use(express.static('public'));

// --- HTTPS si possible --------------------------------------------------------
let server;
try {
  const tlsOptions = {
    key:  fs.readFileSync('cert/key.pem'),
    cert: fs.readFileSync('cert/cert.pem'),
  };
  server = https.createServer(tlsOptions, app);
  console.log('✅ HTTPS activé (cert/ trouvés)');
} catch {
  server = http.createServer(app);
  console.log('⚠️  Certificat introuvable -> démarrage en HTTP (dev uniquement)');
}

const io = new Server(server, {
  cors: { origin: '*'} // pratique en dev LAN
});

// --- File d’attente & paires -------------------------------------------------
const queue = new Set();     // sockets en attente
const pairs = new Map();     // socketId -> peerId

const inPair    = (id) => pairs.has(id);
const partnerOf = (id) => pairs.get(id);

// Petite aide log
function logq() {
  console.log(`   ↪ queue:${queue.size}  pairs:${pairs.size / 2}`);
}

// Essaie d'apparier tant qu'on a au moins 2 personnes
function match() {
  while (queue.size >= 2) {
    const [a, b] = [...queue].slice(0, 2);
    queue.delete(a); queue.delete(b);
    pairs.set(a, b); pairs.set(b, a);
    console.log(`🤝 MATCH  ${a}  <->  ${b}`);
    io.to(a).emit('match', { peerId: b });
    io.to(b).emit('match', { peerId: a });
  }
  logq();
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
  console.log(`🧹 END    ${id}  x  ${other}`);
  logq();
}

// --- Signaling / File d’attente ----------------------------------------------
io.on('connection', (socket) => {
  console.log(`🔌 CONNECT ${socket.id}`);

  // Rejoint la file (idempotent)
  socket.on('queue:join', () => {
    if (inPair(socket.id)) return;   // déjà en pair
    queue.add(socket.id);
    console.log(`➕ JOIN    ${socket.id}`);
    match();
  });

  // Quitte la file / coupe la session en cours
  socket.on('queue:leave', () => {
    queue.delete(socket.id);
    console.log(`➖ LEAVE   ${socket.id}`);
    endPair(socket.id);
  });

  // Bouton "Suivant" : coupe la pair actuelle puis se remet en file
  socket.on('next', () => {
    queue.delete(socket.id);
    console.log(`⏭️  NEXT    ${socket.id}`);
    endPair(socket.id);
    queue.add(socket.id);   // refile immédiate
    match();
  });

  // --- WebRTC signaling entre pairs (logs utiles pour debug ICE) -------------
  socket.on('rtc:offer',  ({ to, sdp }) => {
    console.log(`📤 OFFER  ${socket.id} -> ${to}  (len=${(sdp?.sdp || '').length})`);
    io.to(to).emit('rtc:offer',  { from: socket.id, sdp });
  });

  socket.on('rtc:answer', ({ to, sdp }) => {
    console.log(`📥 ANSWER ${socket.id} -> ${to}  (len=${(sdp?.sdp || '').length})`);
    io.to(to).emit('rtc:answer', { from: socket.id, sdp });
  });

  socket.on('rtc:ice',    ({ to, candidate }) => {
    console.log(`🧊 ICE     ${socket.id} -> ${to}  (${candidate?.type || 'candidate'})`);
    io.to(to).emit('rtc:ice',    { from: socket.id, candidate });
  });

  // --- Bouton "Signaler" (log simple pour le moment) -------------------------
  socket.on('report', ({ against }) => {
    console.log(`🚩 REPORT  ${socket.id} signale ${against}`);
    // TODO: Compter par target et kick si > X sur 5min
  });

  // Déconnexion : nettoyage total
  socket.on('disconnect', () => {
    queue.delete(socket.id);
    endPair(socket.id, { notify: true });
    console.log(`🔌 CLOSE   ${socket.id}`);
  });
});

// --- Route statut rapide ------------------------------------------------------
app.get('/status', (req, res) => {
  res.json({
    queue: queue.size,
    pairs: pairs.size / 2,
    time:  new Date().toISOString()
  });
});

// --- Lancement ----------------------------------------------------------------
const HOST = '0.0.0.0';
const PORT = 3000;
server.listen(PORT, HOST, () => {
  const proto = server instanceof https.Server ? 'https' : 'http';
  console.log(`✅ LegalShuffleCam -> ${proto}://0.0.0.0:${PORT}`);
  console.log('   Ouvre depuis les deux téléphones la même URL ci-dessus.');
});