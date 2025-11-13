let isMatching = false;

window.connectSocketAndWebRTC = function(stream, config) {
  if (!stream) {
    console.error("[LISTENER] Aucun flux fourni pour initialiser WebRTC.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Flux local manquant pour initialiser WebRTC." }
    }));
    return;
  }

  window.initSocket();

  window.socket.on("partner", async (data) => {
    if (isMatching) return;
    isMatching = true;

    console.log(`[LISTENER-DIAG] Événement "partner" reçu :`, data);
    if (!data || !data.id || typeof data.id !== 'string') {
      console.error("[LISTENER-DIAG] ERREUR : Données partenaire invalides.");
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Données partenaire invalides." }
      }));
      isMatching = false;
      return;
    }

    try {
      setTimeout(() => {
        window.startCall(data.id);
        isMatching = false;
      }, 500);
    } catch (err) {
      console.error("[LISTENER-DIAG] Erreur dans startCall :", err);
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Erreur WebRTC : erreur de l'application", error: err }
      }));
      isMatching = false;
    }
  });

  window.socket.on("offer", (data) => {
    console.log(`[LISTENER-DIAG] Offre reçue :`, data);
    if (!data || !data.sdp || !data.from) {
      console.error("[LISTENER-DIAG] ERREUR : Données d'offre invalides.");
      return;
    }
    window.handleOffer(data);
  });

  window.socket.on("answer", (data) => {
    console.log(`[LISTENER-DIAG] Réponse reçue :`, data);
    if (!data || !data.sdp) {
      console.error("[LISTENER-DIAG] ERREUR : Données de réponse invalides.");
      return;
    }
    window.handleAnswer(data);
  });

  window.socket.on("ice-candidate", (data) => {
    console.log(`[LISTENER-DIAG] Candidat ICE reçu :`, data);
    if (!data || !data.candidate) {
      console.error("[LISTENER-DIAG] ERREUR : Candidat ICE invalide.");
      return;
    }
    window.handleICECandidate(data);
  });

  window.socket.on("connect_error", (err) => {
    console.error("[LISTENER-DIAG] Erreur de connexion Socket.IO :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur Socket.IO.", error: err }
    }));
  });

  window.socket.on("connect", () => {
    console.log(`[LISTENER-DIAG] Connecté à Socket.IO (id: ${window.socket.id}).`);
    window.socket.emit("ready-for-match");
    console.log(`[LISTENER-DIAG] "ready-for-match" émis par ${window.socket.id}.`);
  });

  window.socket.on("disconnect", (reason) => {
    console.log(`[LISTENER-DIAG] Déconnecté de Socket.IO (raison: ${reason}).`);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: `Déconnecté de Socket.IO : ${reason}` }
    }));
  });

  window.addEventListener('rtcConnected', (event) => {
    console.log("[LISTENER-DIAG] Connexion WebRTC établie :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "✅ Connecté à un partenaire !";
    }
  });

  window.addEventListener('rtcFailed', (event) => {
    console.error("[LISTENER-DIAG] Échec de connexion WebRTC :", event.detail.error);
    if (window.topBar) {
      window.topBar.textContent = "❌ Échec de connexion. Réessayez.";
    }
  });

  window.addEventListener('rtcError', (event) => {
    console.error("[LISTENER-DIAG] Erreur WebRTC :", event.detail.message);
    console.trace("🔍 Trace complète de l'erreur WebRTC");
    if (window.topBar) {
      window.topBar.textContent = `⚠ ${event.detail.message}`;
    }
  });

  window.addEventListener('rtcDisconnected', (event) => {
    console.log("[LISTENER-DIAG] Déconnexion WebRTC :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
    }
  });
};