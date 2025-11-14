const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/socket.io', express.static(path.join(__dirname, 'node_modules', 'socket.io-client', 'dist')));

app.get('/healthz', (_req, res) => res.type('text/plain').send('OK'));

const REPORTS_DIR = path.join(__dirname, 'api', 'logs', 'reports');
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["https://legalshufflecam.ovh", "http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

let waitingClient = null;

io.on('connection', socket => {
  console.log('[LSC] Nouveau client connecté :', socket.id);

  socket.onAny((event, ...args) => {
    console.log(`[TRACE] Événement reçu : ${event}`, args);
  });

  socket.on('ready-for-match', () => {
    console.log('[MATCHMAKING] Client prêt :', socket.id);
    console.log('[MATCHMAKING] État de waitingClient :', waitingClient?.id, 'connecté =', waitingClient?.connected);

    if (waitingClient && waitingClient.connected) {
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

      const partnerSocket = waitingClient;
      waitingClient = null;

      setTimeout(() => {
        if (partnerSocket?.connected && socket.connected) {
          socket.emit("partner", { id: partnerSocket.id });
          partnerSocket.emit("partner", { id: socket.id });
          console.log(`[MATCHMAKING] Appariement réussi : ${socket.id} ↔ ${partnerSocket.id}`);
        } else {
          console.warn("[MATCHMAKING] ❌ Appariement annulé : un des deux clients est déconnecté");
        }
      }, 300);

    } else {
      console.log('[MATCHMAKING] Aucun client en attente. Mise en file :', socket.id);
      waitingClient = socket;
    }
  });

  socket.on("offer", data => {
    const target = io.sockets.sockets.get(data.to);
    if (target?.connected) {
      console.log('[RTC] Offre envoyée à', data.to);
      target.emit("offer", { from: socket.id, sdp: data.sdp });
    } else {
      console.warn('[RTC] ❌ Offre ignorée, destinataire déconnecté :', data.to);
      socket.emit("rtc-error", { message: "Destinataire déconnecté" });
    }
  });

  socket.on("answer", data => {
    const target = io.sockets.sockets.get(data.to);
    if (target?.connected) {
      console.log('[RTC] Réponse envoyée à', data.to);
      target.emit("answer", { from: socket.id, sdp: data.sdp });
    } else {
      console.warn('[RTC] ❌ Réponse ignorée, destinataire déconnecté :', data.to);
      socket.emit("rtc-error", { message: "Destinataire déconnecté" });
    }
  });

  socket.on("ice-candidate", data => {
    const target = io.sockets.sockets.get(data.to);
    if (target?.connected) {
      console.log('[RTC] ICE envoyé à', data.to);
      target.emit("ice-candidate", { from: socket.id, candidate: data.candidate });
    } else {
      console.warn('[RTC] ❌ ICE ignoré, destinataire déconnecté :', data.to);
    }
  });

  socket.on("report", () => {
    console.log('[MODERATION] Signalement reçu pour :', socket.id);
    socket.emit("was-reported");
  });

  socket.on("ban-me", () => {
    console.log('[MODERATION] Bannissement forcé :', socket.id);
    socket.emit("force-disconnect", "banned");
  });

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

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[LSC] Serveur HTTP démarré sur le port ${PORT}`);
});