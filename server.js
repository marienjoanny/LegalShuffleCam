const fs = require('fs');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

// Sert les fichiers statiques
app.use(express.static('public'));
app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

// Endpoint de santé
app.get('/healthz', (_req, res) => res.type('text/plain').send('OK'));

// Certificats SSL
const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/legalshufflecam.ovh/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/legalshufflecam.ovh/fullchain.pem')
};

// Serveur HTTPS
const server = https.createServer(options, app);

// Initialisation Socket.IO
const io = new Server(server, {
  cors: {
    origin: "https://legalshufflecam.ovh",
    methods: ["GET", "POST"]
  }
});

let waitingClient = null;

// Gestion des connexions
io.on('connection', socket => {
  console.log('[LSC] Nouveau client connecté :', socket.id);

  // 🔍 Traçage global des événements
  socket.onAny((event, ...args) => {
    console.log(`[TRACE] Événement reçu : ${event}`, args);
  });

  socket.on('ready-for-match', () => {
    console.log('[MATCHMAKING] Client prêt :', socket.id);
    console.log('[MATCHMAKING] État de waitingClient :', waitingClient && waitingClient.id, 'connecté =', waitingClient && waitingClient.connected);

    if (waitingClient && waitingClient.connected !== false) {
      console.log('[MATCHMAKING] Mise en relation entre', socket.id, 'et', waitingClient.id);
      socket.emit("partner", waitingClient.id);
      waitingClient.emit("partner", socket.id);
      waitingClient = null;
    } else {
      console.log('[MATCHMAKING] Aucun client en attente. Mise en file :', socket.id);
      waitingClient = socket;
    }
  });

  socket.on("offer", data => {
    console.log('[RTC] Offre envoyée à', data.to);
    io.to(data.to).emit("offer", { from: socket.id, sdp: data.sdp });
  });

  socket.on("answer", data => {
    console.log('[RTC] Réponse envoyée à', data.to);
    io.to(data.to).emit("answer", { from: socket.id, sdp: data.sdp });
  });

  socket.on("ice-candidate", data => {
    console.log('[RTC] ICE envoyé à', data.to);
    io.to(data.to).emit("ice-candidate", { from: socket.id, candidate: data.candidate });
  });

  socket.on("report", () => {
    console.log('[MODERATION] Signalement reçu pour :', socket.id);
    socket.emit("was-reported");
  });

  socket.on("ban-me", () => {
    console.log('[MODERATION] Bannissement forcé :', socket.id);
    socket.emit("force-disconnect", "banned");
  });

  socket.on("disconnect", reason => {
    console.log('[LSC] Client déconnecté :', socket.id, 'Raison :', reason);
    if (waitingClient === socket) {
      console.log('[MATCHMAKING] Client en attente déconnecté :', socket.id);
      waitingClient = null;
    }
  });
});

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[LSC] Serveur HTTPS démarré sur le port ${PORT}`);
});
