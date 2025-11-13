// LegalShuffleCam • listener.js
// Gestion des événements Socket.IO et WebRTC

let isMatching = false;
let currentPartnerId = null;

// Initialisation de Socket.IO et des écouteurs
window.connectSocketAndWebRTC = function(stream, config) {
  if (!stream) {
    console.error("[LISTENER] Aucun flux fourni pour initialiser WebRTC.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Flux local manquant pour initialiser WebRTC." }
    }));
    return;
  }

  // Initialisation de Socket.IO
  window.initSocket();

  // Écouteur pour la connexion Socket.IO
  window.socket.on("connect", () => {
    console.log(`[LISTENER] Connecté à Socket.IO (id: ${window.socket.id}).`);
    window.dispatchEvent(new CustomEvent('socketConnected', {
      detail: { message: "Connecté au serveur de signalisation." }
    }));
  });

  // Écouteur pour les erreurs de connexion Socket.IO
  window.socket.on("connect_error", (err) => {
    console.error("[LISTENER] Erreur de connexion Socket.IO :", err);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Erreur de connexion au serveur.", error: err }
    }));
  });

  // Écouteur pour la déconnexion Socket.IO
  window.socket.on("disconnect", (reason) => {
    console.log(`[LISTENER] Déconnecté de Socket.IO (raison: ${reason}).`);
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: `Déconnecté du serveur : ${reason}` }
    }));
  });

  // Écouteur pour l'événement "partner" (appariement)
  window.socket.on("partner", async (data) => {
    if (isMatching) {
      console.warn("[LISTENER] Appariement déjà en cours. Ignoré.");
      return;
    }

    isMatching = true;
    console.log(`[LISTENER] Événement "partner" reçu :`, data);

    if (!data || !data.id || typeof data.id !== 'string') {
      console.error("[LISTENER] ERREUR : Données partenaire invalides.");
      window.dispatchEvent(new CustomEvent('rtcError', {
        detail: { message: "Données partenaire invalides." }
      }));
      isMatching = false;
      return;
    }

    currentPartnerId = data.id;

    setTimeout(() => {
      try {
        if (window.socket?.connected) {
          console.log(`[LISTENER] Démarrage de l'appel avec ${currentPartnerId}.`);
          window.startCall(currentPartnerId);
        } else {
          console.warn("[LISTENER] Socket.IO déconnecté avant startCall.");
          window.dispatchEvent(new CustomEvent('rtcError', {
            detail: { message: "Connexion perdue avant l'appel." }
          }));
        }
      } catch (err) {
        console.error("[LISTENER] Erreur dans startCall :", err);
        window.dispatchEvent(new CustomEvent('rtcError', {
          detail: { message: "Erreur WebRTC : échec de l'appel.", error: err }
        }));
      } finally {
        isMatching = false;
      }
    }, 500);
  });

  // Écouteur pour les offres WebRTC
  window.socket.on("offer", (data) => {
    console.log(`[LISTENER] Offre reçue :`, data);
    if (!data || !data.sdp || !data.from) {
      console.error("[LISTENER] ERREUR : Données d'offre invalides.");
      return;
    }

    if (data.from === currentPartnerId) {
      window.handleOffer(data);
    } else {
      console.warn("[LISTENER] Offre reçue d'un partenaire non actuel. Ignoré.");
    }
  });

  // Écouteur pour les réponses WebRTC
  window.socket.on("answer", (data) => {
    console.log(`[LISTENER] Réponse reçue :`, data);
    if (!data || !data.sdp) {
      console.error("[LISTENER] ERREUR : Données de réponse invalides.");
      return;
    }

    if (data.from === currentPartnerId) {
      window.handleAnswer(data);
    } else {
      console.warn("[LISTENER] Réponse reçue d'un partenaire non actuel. Ignoré.");
    }
  });

  // Écouteur pour les candidats ICE
  window.socket.on("ice-candidate", (data) => {
    console.log(`[LISTENER] Candidat ICE reçu :`, data);
    if (!data || !data.candidate) {
      console.error("[LISTENER] ERREUR : Candidat ICE invalide.");
      return;
    }

    if (data.from === currentPartnerId) {
      window.handleICECandidate(data);
    } else {
      console.warn("[LISTENER] Candidat ICE reçu d'un partenaire non actuel. Ignoré.");
    }
  });

  // Écouteur pour les événements personnalisés
  window.addEventListener('rtcConnected', (event) => {
    console.log("[LISTENER] Connexion WebRTC établie :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "✅ Connecté à un partenaire !";
    }
  });

  window.addEventListener('rtcError', (event) => {
    console.error("[LISTENER] Erreur WebRTC :", event.detail.message);
    if (event.detail.error) {
      console.trace("[LISTENER] Trace de l'erreur :", event.detail.error);
    }
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