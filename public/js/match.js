// LOG: Module /js/match.js chargé. (Validation obligatoire)
function showTopbarLog(message) {
    // Utiliser la fonction showTopbar globale définie dans index-real.php
    if (typeof showTopbar === 'function') {
        showTopbar(message);
    } else {
        const topBar = document.getElementById("topBar");
        if (topBar) {
            topBar.textContent = message;
        } else {
            console.log(`[TOPBAR-LOG] ${message}`); 
        }
    }
}
showTopbarLog("✅ Module match.js chargé.");

let peer = null;
let conn = null;
let currentCall = null; // 🚨 Variable CRITIQUE pour le shuffle

// ----------------------------------------------------------------------
// Fonctions d'Appel (Réutilisables par Shuffle et Direct)
// ----------------------------------------------------------------------

// Fonction interne pour gérer la création de l'appel
function setupOutgoingCall(partnerId, stream) {
    if (currentCall) {
        currentCall.close();
        currentCall = null;
        showTopbarLog(`🔁 Fermeture de l'appel précédent avant appel vers ${partnerId}.`);
    }

    // 1. Lancer l'appel (Caller)
    const call = peer.call(partnerId, stream);
    currentCall = call; // 🚨 Stocker la référence de l'appel sortant
    
    call.on("stream", remoteStream => {
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) { remoteVideo.srcObject = remoteStream; remoteVideo.play(); }
        showTopbarLog(`✅ Appel sortant établi avec ${partnerId}`);
    });
    
    call.on("close", () => { 
        currentCall = null; 
        showTopbarLog("💔 Appel sortant fermé.");
    });

    // 2. Connexion de données (optionnelle)
    const c = peer.connect(partnerId);
    c.on("open", () => {
        c.send({ hello: "👋 depuis " + window.myPeerId });
    });
    conn = c; // Stocker la référence de la connexion de données
}


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

        // --- NOUVELLE LOGIQUE D'APPEL DIRECT ---
        const urlParams = new URLSearchParams(window.location.search);
        const partnerId = urlParams.get("partnerId");

        if (partnerId && partnerId !== id) {
             // Appeler l'interlocuteur directement si l'ID est dans l'URL
            showTopbarLog("📞 Appel direct initialisé par Annuaire...");
            setupOutgoingCall(partnerId, window.localStream);
        }
        // ------------------------------------
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

/**
 * Lance la recherche d'un partenaire aléatoire et démarre l'appel.
 */
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
      const partnerId = data.partnerId;
      if (partnerId) {
        showTopbarLog(`🔗 Tentative d'appel vers ${partnerId}`);
        setupOutgoingCall(partnerId, window.localStream);
      } else {
        showTopbarLog("❌ Aucun interlocuteur disponible (Annuaire vide ou auto-appel)");
      }
    })
    .catch(err => {
      showTopbarLog(`❌ Erreur Réseau/Annuaire : ${err.message}`);
      console.error("[MATCH]", err);
    });
}

/**
 * Lance directement un appel vers un ID spécifique (utilisé par l'annuaire).
 * NOTE: Cette fonction est appelée dans l'écouteur 'open' de PeerJS.
 */
// export function directMatch(partnerId) {
//     // NOTE: Cette fonction n'est plus nécessaire comme exportation,
//     // car la logique est gérée directement dans peer.on('open') de initLocalStreamAndPeer.
// }

export function bindMatchEvents() {
  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    // S'assurer qu'un seul écouteur est présent
    btnNext.removeEventListener("click", nextMatch); 
    btnNext.addEventListener("click", nextMatch);
  }
}
