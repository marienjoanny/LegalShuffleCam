const http = require('http');
const { Server } = require('socket.io');

console.log('🔧 Wrapper: loading ./server …');
const srvModule = require('./server');
const app = srvModule?.app || srvModule?.default || srvModule;

if (typeof app !== 'function') {
  console.error('❌ server.js n’a pas exporté une app Express valide');
  process.exit(1);
}

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

// Handlers Socket.IO de base (tu pourras remettre les tiens ici)
io.on('connection', (socket) => {
  console.log('🔌 CONNECT', socket.id);
  socket.on('next', () => {
    console.log('⏭️  NEXT  ', socket.id);
    socket.emit('next_ack');
  });
  socket.on('disconnect', () => console.log('🔌 CLOSE  ', socket.id));
});

const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Wrapper: listening on http://0.0.0.0:${PORT}`);
});
