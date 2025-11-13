// LegalShuffleCam • listener.js (version corrigée avec socket global)
// Gestion des événements Socket.IO, intégration avec WebRTC et diagnostics avancés.

/**
 * Initialise la connexion Socket.IO et configure les écouteurs pour WebRTC.
 * @param {MediaStream} stream - Flux local à partager via WebRTC.
 * @param {Object} config - Configuration RTC (iceServers, etc.)
 */
window.connectSocketAndWebRTC = function(stream, config) {
  if (!stream) {
    console.error("[LISTENER] Aucun flux fourni pour initialiser WebRTC.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Flux local manquant pour initialiser WebRTC." }
    }));
    return;
  }

  // Initialise Socket.IO
  window.initSocket();

  // Écoute l'événement "partner" pour démarrer un appel
  window.socket.on("partner", async (data) => {
    console.log(`[LISTENER-DIAG] Événement "partner" reçu :`, data);
    if (!data || !data.id || typeof data.id !== 'string') {
      console.error("[LISTENER-DIAG] ERREUR : Données partenaire invalides ou manquantes.");
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Données partenaire invalides." }
      }));
      return;
    }

    try {
      console.log(`[LISTENER-DIAG] Appel de startCall avec partnerId: ${data.id}`);
      await window.startCall(data.id);
    } catch (err) {
      console.error("[LISTENER-DIAG] Erreur dans startCall :", err);
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Échec du démarrage de l'appel.", error: err }
      }));
    }
  });

  // Écoute les offres WebRTC entrantes
  window.socket.on("offer", (data) => {
    console.log(`[LISTENER-DIAG] Offre reçue :`, data);
    if (!data || !data.sdp || !data.from) {
      console.error("[LISTENER-DIAG] ERREUR : Données d'offre invalides.");
      return;
    }
    window.handleOffer(data);
  });

  // Écoute les réponses WebRTC entrantes
  window.socket.on("answer", (data) => {
    console.log(`[LISTENER-DIAG] Réponse reçue :`, data);
    if (!data || !data.sdp) {
      console.error("[LISTENER-DIAG] ERREUR : Données de réponse invalides.");
      return;
    }
    window.handleAnswer(data);
  });

  // Écoute les candidats ICE entrants
  window.socket.on("ice-candidate", (data) => {
    console.log(`[LISTENER-DIAG] Candidat ICE reçu :`, data);
    if (!data || !data.candidate) {
      console.error("[LISTENER-DIAG] ERREUR : Candidat ICE invalide.");
      return;
    }
    window.handleICECandidate(data);
  });

  // Écoute les erreurs Socket.IO
  window.socket.on("connect_error", (err) => {
    console.error("[LISTENER-DIAG] Erreur de connexion Socket.IO :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur Socket.IO.", error: err }
    }));
  });

  // Écoute la connexion Socket.IO
  window.socket.on("connect", () => {
    console.log(`[LISTENER-DIAG] Connecté à Socket.IO (id: ${window.socket.id}).`);
    window.socket.emit("ready-for-match");
    console.log(`[LISTENER-DIAG] "ready-for-match" émis par ${window.socket.id}.`);
  });

  // Écoute la déconnexion Socket.IO
  window.socket.on("disconnect", (reason) => {
    console.log(`[LISTENER-DIAG] Déconnecté de Socket.IO (raison: ${reason}).`);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: `Déconnecté de Socket.IO : ${reason}` }
    }));
  });

  // Événements personnalisés pour l'UI
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