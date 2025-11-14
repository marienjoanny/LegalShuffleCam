// LegalShuffleCam • listener.js
// Gestion des événements Socket.IO et WebRTC

let isMatching = false;
let currentPartnerId = null;
let isCallInProgress = false; // État pour suivre si un appel est en cours

/**
 * Initialise Socket.IO et configure tous les écouteurs de signalisation.
 * Cette fonction est appelée par app.js après la configuration WebRTC.
 */
window.initSocketAndListeners = function() {
  
  // 1. Initialisation de Socket.IO
  if (typeof window.initSocket === 'function') {
      window.initSocket();
      console.log("[LISTENER] Socket.IO initialisé.");
  } else {
      console.warn("[LISTENER] window.initSocket() non défini. Assurez-vous que socket.io.js est chargé.");
      // L'objet window.socket doit exister avant de configurer les écouteurs
  }
  
  // Vérification de la disponibilité du socket
  if (typeof window.socket === 'undefined') {
    console.error("[LISTENER] L'objet Socket.IO est manquant après l'initialisation.");
    return;
  }

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
    isCallInProgress = false; // Réinitialiser l'état en cas de déconnexion
  });

  // Écouteur pour l'événement "partner" (appariement)
  window.socket.on("partner", async (data) => {
    if (isMatching || isCallInProgress) {
      console.warn("[LISTENER] Appariement déjà en cours ou appel en cours. Ignoré.");
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
    isCallInProgress = true; // Mettre à jour l'état pour indiquer qu'un appel est en cours

    console.log(`[LISTENER] Partenaire trouvé : ${currentPartnerId}. En attente de l'offre SDP ou envoi d'une offre.`);

    // Seuls les clients initiateurs (ceux avec un ID de socket inférieur) appellent startCall.
    if (window.socket.id < currentPartnerId) {
      try {
        if (window.socket?.connected) {
          console.log(`[LISTENER] Démarrage de l'appel avec ${currentPartnerId}.`);
          // Vérification de l'existence de la fonction rtc-core.js
          if (typeof window.startCall === 'function') {
            window.startCall(currentPartnerId);
          } else {
            console.error("[LISTENER] window.startCall non défini. rtc-core.js est-il chargé ?");
          }
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
      }
    } else {
      console.log(`[LISTENER] En attente de l'offre SDP de ${currentPartnerId}.`);
    }

    isMatching = false;
  });

  // Écouteur pour les offres WebRTC
  window.socket.on("offer", (data) => {
    console.log(`[LISTENER] Offre reçue :`, data);
    if (!data || !data.sdp || !data.from) {
      console.error("[LISTENER] ERREUR : Données d'offre invalides.");
      return;
    }

    if (data.from === currentPartnerId && typeof window.handleOffer === 'function') {
      window.handleOffer(data);
    } else {
      console.warn("[LISTENER] Offre reçue d'un partenaire non actuel ou handleOffer manquant. Ignoré.");
    }
  });

  // Écouteur pour les réponses WebRTC
  window.socket.on("answer", (data) => {
    console.log(`[LISTENER] Réponse reçue :`, data);
    if (!data || !data.sdp) {
      console.error("[LISTENER] ERREUR : Données de réponse invalides.");
      return;
    }

    if (data.from === currentPartnerId && typeof window.handleAnswer === 'function') {
      window.handleAnswer(data);
    } else {
      console.warn("[LISTENER] Réponse reçue d'un partenaire non actuel ou handleAnswer manquant. Ignoré.");
    }
  });

  // Écouteur pour les candidats ICE
  window.socket.on("ice-candidate", (data) => {
    // console.log(`[LISTENER] Candidat ICE reçu :`, data); // Moins verbeux
    if (!data || !data.candidate) {
      console.error("[LISTENER] ERREUR : Candidat ICE invalide.");
      return;
    }

    if (data.from === currentPartnerId && typeof window.handleICECandidate === 'function') {
      window.handleICECandidate(data);
    } else {
      // console.warn("[LISTENER] Candidat ICE reçu d'un partenaire non actuel ou handleICECandidate manquant. Ignoré."); // Moins verbeux
    }
  });

  // Écouteur pour les événements personnalisés (RTC/Déconnexion gérés par app.js pour le DOM)
  
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
    isCallInProgress = false; 
  });

  window.addEventListener('rtcDisconnected', (event) => {
    console.log("[LISTENER] Déconnexion WebRTC :", event.detail.message);
    if (window.topBar) {
      window.topBar.textContent = "🔍 Prêt pour une nouvelle connexion.";
    }
    isCallInProgress = false; 
  });

  // Écouteur pour l'événement "partner-info"
  window.socket.on("partner-info", (data) => {
    console.log(`[LISTENER] Informations partenaire reçues :`, data);
    if (data && data.remoteId && data.ip) {
      console.log(`[LISTENER] Partenaire : ${data.remoteId}, IP : ${data.ip}`);
    }
  });
};

// Fonction pour gérer l'événement "ready-for-match" (gardée pour la compatibilité)
window.sendReadyForMatch = function() {
  if (isCallInProgress) {
    console.warn("[LISTENER] Un appel est déjà en cours. Ignoré.");
    return;
  }

  if (window.socket?.connected) {
    console.log("[LISTENER] Envoi de ready-for-match.");
    window.socket.emit("ready-for-match");
  } else {
    console.warn("[LISTENER] Socket.IO non connecté.");
    window.dispatchEvent(new CustomEvent('rtcError', {
      detail: { message: "Socket.IO non connecté." }
    }));
  }
};