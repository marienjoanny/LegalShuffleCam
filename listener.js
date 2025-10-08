const http = require('http');
const { Server } = require('socket.io');

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
  console.log(`✅ Wrapper: listening on http://0.0.0.0:${PORT}`);
});

io.on('connection', (socket) => {
  const ip = maskIp(socket.handshake.address || 'unknown');

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

  socket.on('disconnect', () => {
    console.log(' CLOSE ', socket.id);
  });
});

function maskIp(ip) {
  // Anonymise l'IP en /24 — ex: 192.168.1.42 → 192.168.1.0
  const parts = ip.split('.');
  if (parts.length === 4) {
    return parts.slice(0, 3).join('.') + '.0';
  }
  return ip;
}

function isBanned(ip) {
  return false; // À adapter
}

function logModeration(action, ip, note = '') {
  const fs = require('fs');
  const line = `${new Date().toISOString()} ${action} ${ip} ${note}\n`;
  fs.appendFile('/var/log/legalshufflecam-moderation.log', line, () => {});
}

function leaveCurrentPair(socket) {
  // À compléter
}

function enqueue(socket) {
  // À compléter
}

function tryMatch() {
  // À compléter
}
