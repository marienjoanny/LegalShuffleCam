const io = require("socket.io-client");

const socket = io("https://localhost:3000", {
  rejectUnauthorized: false,
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("[TEST] Client connecté :", socket.id);
  socket.emit("ready-for-match");
});

socket.on("partner", (partnerId) => {
  console.log("✅ [TEST] Partenaire reçu :", partnerId);
  process.exit(0);
});

setTimeout(() => {
  console.log("❌ [TEST] Aucun partenaire reçu après 10s");
  process.exit(1);
}, 10000);
