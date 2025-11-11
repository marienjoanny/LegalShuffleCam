// 🔌 Initialisation socket.js
const socket = io();

socket.on("partner-found", (data) => {
  console.log("[RTC] 🎯 Partenaire reçu :", data);

  if (!localStream) {
    console.warn("[RTC] ⏳ Flux local non prêt — attente avant initiateCall");
    const waitForStream = setInterval(() => {
      if (localStream) {
        clearInterval(waitForStream);
        console.log("[RTC] ✅ Flux local prêt — appel initiateCall");
        initiateCall();
      }
    }, 100);
    return;
  }

  initiateCall();
});
