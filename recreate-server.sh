#!/bin/bash

echo "🔧 Reconstruction complète de server.js avec HTTPS et écoute sur 0.0.0.0..."

FILE="/var/www/legalshufflecam/server.js"
BAK="$FILE.bak.$(date +%s)"

# Sauvegarde
cp "$FILE" "$BAK"
echo "📦 Ancien server.js sauvegardé sous : $BAK"

# Recréation
cat <<'SERV' > "$FILE"
/**
 * SERVER.JS - Serveur HTTPS pour LegalShuffleCam
 */

const fs = require('fs');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;

// Sert les fichiers statiques
app.use(express.static('public'));

// Sert le client socket.io.js
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

  socket.on('ready-for-match', () => {
    console.log('[MATCHMAKING] Client prêt :', socket.id);

    if (waitingClient && waitingClient.connected) {
      console.log('[MATCHMAKING] Mise en relation entre', socket.id, 'et', waitingClient.id);
      socket.emit('match-found', waitingClient.id);
      waitingClient.emit('match-found', socket.id);
      waitingClient = null;
    } else {
      console.log('[MATCHMAKING] Aucun client en attente. Mise en file :', socket.id);
      waitingClient = socket;
    }
  });

  socket.on('disconnect', reason => {
    console.log('[LSC] Client déconnecté :', socket.id, 'Raison :', reason);
    if (waitingClient === socket) {
      console.log('[MATCHMAKING] Client en attente déconnecté :', socket.id);
      waitingClient = null;
    }
  });

  socket.on('report', () => {
    console.log('[MODERATION] Signalement reçu pour :', socket.id);
    socket.emit('was-reported');
  });

  socket.on('ban-me', () => {
    console.log('[MODERATION] Bannissement forcé :', socket.id);
    socket.emit('force-disconnect', 'banned');
  });
});

// Démarrage du serveur
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[LSC] Serveur HTTPS démarré sur le port ${PORT}`);
});
SERV

echo "✅ Nouveau server.js prêt. Lance ./run-server.sh pour tester."
