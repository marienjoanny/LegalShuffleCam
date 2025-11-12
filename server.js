const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware JSON
app.use(express.json());

// Sert les fichiers statiques
app.use(express.static('public'));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io-client', 'dist')));

// Endpoint de santé
app.get('/healthz', (_req, res) => res.type('text/plain').send('OK'));

// 📁 Dossier de stockage des signalements
const REPORTS_DIR = path.join(__dirname, 'api', 'logs', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// 🛡️ Route API pour recevoir les signalements
app.post('/api/report', (req, res) => {
  const report = req.body;

  if (!report || !report.remoteId || !report.reason || !report.image) {
    console.warn("❌ Signalement incomplet :", report);
    return res.status(400).send({ error: 'Signalement incomplet' });
  }

  const enrichedReport = {
    timestamp: report.timestamp || new Date().toISOString(),
    reporterId: report.reporterId || 'inconnu',
    reportedId: report.remoteId,
    ip: report.ip || req.ip || 'N/A',
    reason: report.reason,
    sessionId: report.sessionId || null,
    imageBase64: report.image
  };

  const filename = `report-${Date.now()}.json`;
  const filepath = path.join(REPORTS_DIR, filename);

  fs.writeFile(filepath, JSON.stringify(enrichedReport, null, 2), 'utf8', (err) => {
    if (err) {
      console.error("❌ Erreur écriture signalement :", err);
      return res.sendStatus(500);
    }
    console.log("✅ Signalement enregistré :", filename);
    res.sendStatus(200);
  });
});

// Serveur HTTP
const server = http.createServer(app);

// Initialisation Socket.IO
const io = new Server(server, {
  cors: {
    origin: "https://legalshufflecam.ovh",
    methods: ["GET", "POST"]
  }
});

let waitingClient = null;

// 🎮 Gestion des connexions Socket.IO
io.on('connection', socket => {
  console.log('[LSC] Nouveau client connecté :', socket.id);

  socket.onAny((event, ...args) => {
    console.log(`[TRACE] Événement reçu : ${event}`, args);
  });

  socket.on('ready-for-match', () => {
    console.log('[MATCHMAKING] Client prêt :', socket.id);
    console.log('[MATCHMAKING] État de waitingClient :', waitingClient?.id, 'connecté =', waitingClient?.connected);

    if (waitingClient && waitingClient.connected !== false) {
      if (waitingClient.id === socket.id) {
        console.warn('[MATCHMAKING] ⚠ Tentative d’appariement avec soi-même ignorée :', socket.id);
        return;
      }

      console.log('[MATCHMAKING] Mise en relation entre', socket.id, 'et', waitingClient.id);

      socket.emit("partner-info", {
        remoteId: waitingClient.id,
        ip: waitingClient.handshake.address
      });

      waitingClient.emit("partner-info", {
        remoteId: socket.id,
        ip: socket.handshake.address
      });

      socket.emit("partner", { id: waitingClient.id });
      waitingClient.emit("partner", { id: socket.id });

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

  // 🔄 Réception du snapshot et broadcast des infos partenaire
  socket.on("snapshot", (data) => {
    const partnerInfo = {
      remoteId: socket.id,
      ip: socket.handshake.address,
      sessionId: data.sessionId || null,
      image: data.image || null
    };

    socket.broadcast.emit("partner-info", partnerInfo);
  });

  socket.on("disconnect", reason => {
    console.log('[LSC] Client déconnecté :', socket.id, 'Raison :', reason);
    if (waitingClient === socket) {
      console.log('[MATCHMAKING] Client en attente déconnecté :', socket.id);
      waitingClient = null;
    }
  });
});

// 🚀 Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[LSC] Serveur HTTP démarré sur le port ${PORT}`);
});