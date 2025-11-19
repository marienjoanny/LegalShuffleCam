// LOG: Module /js/match.js chargé. (Validation obligatoire)
function showTopbarLog(message) {
    const topBar = document.getElementById("topBar");
    if (topBar) {
        topBar.textContent = message;
    } else {
        // Fallback si la topBar n'est pas chargée (pour le débogage console)
        console.log(`[TOPBAR-LOG] ${message}`); 
    }
}
showTopbarLog("✅ Module match.js chargé.");

let peer = null;
let conn = null;
let currentCall = null; // 🚨 Variable CRITIQUE pour le shuffle

// Initialisation du stream local et de PeerJS. 
async function initLocalStreamAndPeer() {
    showTopbarLog("▶️ Initialisation du média et de PeerJS...");
    
    // 1. Démarrer le stream local immédiatement
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        window.localStream = stream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) { 
            localVideo.srcObject = stream; 
            localVideo.play(); 
            // Débloquer le bouton
            const btnNext = document.getElementById("btnNext");
            if (btnNext) { btnNext.disabled = false; }
        }
        showTopbarLog("✅ Média capturé. En attente de l'ID Peer.");
    } catch (err) {
        console.error("❌ Impossible d'obtenir le flux média:", err);
        showTopbarLog("❌ ÉCHEC CRITIQUE: Accès Média Refusé.");
        throw new Error("Local Stream Failed"); 
    }

    // 2. Initialisation PeerJS
    peer = new Peer(undefined, {
      host: 'legalshufflecam.ovh',
      port: 443,
      path: '/peerjs',
      secure: true
    });
    
    // Enregistrer l'ID dès qu'il est prêt
    peer.on("open", id => {
      window.myPeerId = id;
      fetch(`/api/register-peer.php?peerId=${id}`); 
      sessionStorage.setItem("peerId", id);
      showTopbarLog(`🟢 Connecté : ${id}`);
    });

    // 3. Gestion centralisée des Appels Entrants (Callee)
    peer.on("call", call => {
        showTopbarLog(`📞 Appel entrant de ${call.peer}.`);
        
        // 🛑 CRITIQUE : Fermer l'appel précédent
        if (currentCall) {
            currentCall.close();
            showTopbarLog(`🔁 Fermeture de l'ancien appel (${currentCall.peer}).`);
        }
        currentCall = call; // Stocker la référence du nouvel appel

        call.answer(window.localStream);
        
        call.on("stream", remoteStream => {
            const remoteVideo = document.getElementById("remoteVideo");
            if (remoteVideo) { remoteVideo.srcObject = remoteStream; remoteVideo.play(); }
            showTopbarLog(`✅ Appel entrant établi avec ${call.peer}.`);
        });
        
        call.on("close", () => { 
            currentCall = null; 
            showTopbarLog("💔 Appel entrant fermé.");
        });
    });

    // 4. Gestion des connexions de données (si utilisées)
    peer.on("connection", c => {
        conn = c;
        conn.on("data", data => {
          showTopbarLog(`👂 Donnée de ${c.peer} : ${JSON.stringify(data)}`);
        });
    });

    // Gestion des erreurs
    peer.on("error", err => {
      console.error("❌ PeerJS", err);
      showTopbarLog(`❌ Erreur PeerJS : ${err.type}`);
    });

    peer.on("disconnected", () => {
      showTopbarLog("⚠ Déconnecté du serveur PeerJS");
    });
    
    peer.on("close", () => {
      showTopbarLog("🔒 Connexion PeerJS fermée");
    });
}

// ----------------------------------------------------------------------
// Fonctions exportées
// ----------------------------------------------------------------------

export function initMatch() {
    initLocalStreamAndPeer().catch(err => {
        // L'erreur est gérée dans le catch interne
    });
}

export function nextMatch() {
  if (!window.myPeerId || !window.localStream) {
    showTopbarLog("❌ Peer ou Média non prêt. Initialisation en cours...");
    return;
  }

  showTopbarLog("🔄 Recherche d’un interlocuteur...");

  // 1. 🛑 CRITIQUE : Fermer l'appel et la connexion de données précédents
  if (currentCall) {
      currentCall.close();
      currentCall = null;
      showTopbarLog("🔁 Fermeture de l'appel précédent avant Shuffle.");
  }
  if (conn) {
      conn.close();
      conn = null;
  }
  
  // 2. Chercher un ID
  fetch(`/api/get-peer.php?callerId=${window.myPeerId}`)
    .then(r => r.json())
    .then(data => {
      if (data.partnerId) {
        showTopbarLog(`🔗 Tentative d'appel vers ${data.partnerId}`);
        
        // 3. Lancer l'appel (Caller)
        const call = peer.call(data.partnerId, window.localStream);
        currentCall = call; // 🚨 Stocker la référence de l'appel sortant
        
        call.on("stream", remoteStream => {
          const remoteVideo = document.getElementById("remoteVideo");
          if (remoteVideo) { remoteVideo.srcObject = remoteStream; remoteVideo.play(); }
          showTopbarLog(`✅ Appel sortant établi avec ${data.partnerId}`);
        });
        
        call.on("close", () => { 
            currentCall = null; 
            showTopbarLog("💔 Appel sortant fermé.");
        });

        // 4. Connexion de données (optionnelle)
        const c = peer.connect(data.partnerId);
        c.on("open", () => {
          c.send({ hello: "👋 depuis " + window.myPeerId });
        });
        conn = c; // Stocker la référence de la connexion de données
        
      } else {
        showTopbarLog("❌ Aucun interlocuteur disponible (Annuaire vide ou auto-appel)");
      }
    })
    .catch(err => {
      showTopbarLog(`❌ Erreur Réseau/Annuaire : ${err.message}`);
      console.error("[MATCH]", err);
    });
}

export function bindMatchEvents() {
  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    // S'assurer qu'un seul écouteur est présent
    btnNext.removeEventListener("click", nextMatch); 
    btnNext.addEventListener("click", nextMatch);
  }
}
