// LegalShuffleCam • listener.js (version optimisée)
// Gestion des événements Socket.IO et intégration avec WebRTC.

window.connectSocketAndWebRTC = function(stream) {
  if (!stream) {
    console.error("[LISTENER] Aucun flux fourni pour initialiser WebRTC.");
    return;
  }

  window.initSocket();

  socket.on("partner", async ({ id }) => {
    console.log(`[LISTENER] Partenaire trouvé : ${id}.`);
    try {
      await window.startCall(id);
    } catch (err) {
      console.error("[LISTENER] Erreur lors du démarrage de l'appel :", err);
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Échec du démarrage de l'appel.", error: err }
      }));
    }
  });

  socket.on("connect_error", (err) => {
    console.error("[LISTENER] Erreur de connexion Socket.IO :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur de connexion au serveur.", error: err }
    }));
  });

  window.addEventListener('rtcConnected', (event) => {
    console.log("[LISTENER] Connexion WebRTC établie :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "✅ Connecté à un partenaire !";
    }
  });

  window.addEventListener('rtcFailed', (event) => {
    console.error("[LISTENER] Échec de connexion WebRTC :", event.detail.error);
    if (window.topBar) {
      window.topBar.textContent = "❌ Échec de connexion. Réessayez.";
    }
  });

  window.addEventListener('rtcError', (event) => {
    console.error("[LISTENER] Erreur WebRTC :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = `⚠ ${event.detail.message}`;
    }
  });

  window.addEventListener('rtcDisconnected', (event) => {
    console.log("[LISTENER] Déconnexion WebRTC :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
    }
  });
};
