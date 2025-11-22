// LOG: Module /js/match.js chargé. (Validation obligatoire)
// Import de la logique de détection de visage (Assurez-vous que face-visible.js est chargé)
import { initFaceDetection, stopFaceDetection } from '/js/face-visible.js';

function showTopbarLog(message) {
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
window.currentCall = null; // Rendu global pour être accessible dans camera.js
window.currentPartnerId = null; // ID du partenaire actif
window.myPeerId = null; // S'assurer que l'ID local est global
window.mySessionId = crypto.randomUUID(); // Nouvelle variable pour le Session ID

// --- Fonctions d'Utilitaires Backend ---

/**
 * Envoie une requête POST/GET générique au backend.
 * @param {string} endpoint - L'endpoint de l'API (ex: 'log-handler.php').
 * @param {Object} data - Les données à envoyer.
 */
async function sendToBackend(endpoint, data = {}, method = 'GET') {
    const url = `${window.location.origin}/api/${endpoint}`;
    // window.currentSessionId est initialisé globalement dans index-real.php, mais si match.js l'initialise avant l'UI,
    // on s'assure qu'il est synchronisé ou défini ici.
    window.currentSessionId = window.currentSessionId || window.mySessionId; 
    
    const fullData = { 
        callerId: window.myPeerId || 'NO_PEER_ID',
        sessionId: window.currentSessionId,
        ...data 
    };

    try {
        let response;
        if (method === 'POST') {
            const formData = new URLSearchParams();
            for (const key in fullData) { formData.append(key, fullData[key]); }

            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });
        } else { // GET
             const queryString = new URLSearchParams(fullData).toString();
             response = await fetch(`${url}?${queryString}`);
        }

        if (!response.ok) {
            console.error(`Backend Error on ${endpoint}:`, response.status, await response.text());
        }
        return await response.json();
    } catch (error) {
        console.error(`Fetch Error on ${endpoint}:`, error);
        return { status: 'error', message: 'Network or server issue.' };
    }
}

/**
 * Enregistre un événement dans le log général (utilisant log-handler.php).
 */
function logActivity(type, message, partnerId = null) {
    sendToBackend('log-handler.php', {
        type: type,
        logMessage: message, // Utilise logMessage pour correspondre au backend
        partnerId: partnerId || window.currentPartnerId || 'N/A',
    }, 'POST');
}

/**
 * Signale la déconnexion au serveur (utilisant unregister-peer.php).
 */
function unregisterPeer(reason = 'Déconnexion navigateur') {
    logActivity('PEER_UNREGISTER', `Déconnexion: ${reason}`);
    sendToBackend('unregister-peer.php', { 
        peerId: window.myPeerId, 
        reason: reason 
    }, 'POST');
}

/**
 * Envoie un ping régulier pour maintenir l'entrée IP fraîche (utilisant ping-peer.php).
 */
function sendPing() {
    if (window.myPeerId) {
        sendToBackend('ping-peer.php', { peerId: window.myPeerId }, 'POST');
    }
}


// ----------------------------------------------------------------------
// Fonctions d'Appel (Réutilisables par Shuffle et Direct)
// ----------------------------------------------------------------------

function closeCurrentCall() {
    if (window.currentCall) {
        logActivity('CALL_CLOSE', `Appel fermé avec ${window.currentPartnerId}.`);
        window.currentCall.close();
        window.currentCall = null;
    }
    window.currentPartnerId = null; // Nettoyage de l'ID du partenaire
    showTopbarLog("💔 Appel fermé.");
}

function setupOutgoingCall(partnerId, stream) {
    if (window.currentCall) {
        closeCurrentCall();
        showTopbarLog(`🔁 Fermeture de l'appel précédent avant appel vers ${partnerId}.`);
    }

    // 1. Lancer l'appel (Caller)
    const call = peer.call(partnerId, stream);
    window.currentCall = call; 
    window.currentPartnerId = partnerId; // 🚨 Mettre à jour l'ID du partenaire
    
    // 🔔 LOGGING: Début de l'appel sortant
    logActivity('CALL_OUTGOING', `Tentative d'appel vers ${partnerId}`);

    if (typeof window.updateLastPeers === 'function') {
        window.updateLastPeers(partnerId);
    }

    call.on("stream", remoteStream => {
        const remoteVideo = document.getElementById("remoteVideo");
        if (remoteVideo) { remoteVideo.srcObject = remoteStream; remoteVideo.play(); }
        showTopbarLog(`✅ Appel sortant établi avec ${partnerId}`);
        // 🔔 LOGGING: Flux reçu
        logActivity('STREAM_RECEIVE', 'Flux distant reçu.', partnerId);
    });
    
    call.on("close", closeCurrentCall); 
    call.on("error", err => {
        console.error("❌ Appel sortant erreur:", err);
        logActivity('CALL_ERROR', `Erreur appel sortant: ${err.message}`, partnerId);
        closeCurrentCall();
    });

    // 2. Connexion de données (optionnelle)
    const c = peer.connect(partnerId);
    c.on("open", () => {
        c.send({ hello: "👋 depuis " + window.myPeerId });
        logActivity('DATA_OPEN', 'Canal de données établi.', partnerId);
    });
    conn = c; 
}

// Intervalle de Ping Global
let pingInterval = null;

function startPingInterval() {
    if (pingInterval) clearInterval(pingInterval);
    sendPing(); // Envoi immédiat
    pingInterval = setInterval(sendPing, 30000); // Toutes les 30 secondes
    console.log("Ping interval started (30s).");
}

// Initialisation du stream local et de PeerJS. 
async function initLocalStreamAndPeer() {
    showTopbarLog("▶️ Initialisation du média et de PeerJS...");
    
    // 1. Démarrer le stream local immédiatement (Capture Média)
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        window.localStream = stream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) { 
            localVideo.srcObject = stream; 
            localVideo.play(); 
            const btnNext = document.getElementById("btnNext");
            if (btnNext) { btnNext.disabled = false; }
            
            // 🚨 Démarre la détection de visage sur le flux local
            if (typeof initFaceDetection === 'function') {
                initFaceDetection(localVideo);
            }
        }
        logActivity('MEDIA_ACCESS', 'Accès caméra/micro OK.');
        showTopbarLog("✅ Média capturé. En attente de l'ID Peer.");
    } catch (err) {
        console.error("❌ Impossible d'obtenir le flux média:", err);
        logActivity('MEDIA_ERROR', `Échec d'accès média: ${err.name}`);
        showTopbarLog("❌ ÉCHEC CRITIQUE: Accès Média Refusé.");
        // 🚨 Arrêter la détection si le flux échoue
        if (typeof stopFaceDetection === 'function') {
            stopFaceDetection();
        }
        throw new Error("Local Stream Failed"); 
    }

    // 2. Initialisation PeerJS (Attendre que l'ID soit prêt)
    await new Promise(resolve => {
        peer = new Peer(undefined, {
          host: 'legalshufflecam.ovh',
          port: 443,
          path: '/peerjs',
          secure: true
        });
        
        peer.on("open", id => {
          window.myPeerId = id;
          if (typeof window.updatePeerIdDisplay === 'function') {
            window.updatePeerIdDisplay(id); // Afficher l'ID dans l'UI
          }
          // 🔔 ENREGISTREMENT INITIAL + START PING
          sendToBackend('register-peer.php', { peerId: id }, 'POST').catch(err => console.error("Register Peer Failed:", err)); 
          sessionStorage.setItem("peerId", id);
          startPingInterval(); // Démarrer le ping
          logActivity('PEER_ONLINE', `PeerID: ${id}`);
          showTopbarLog(`🟢 Connecté : ${id}`);
          resolve(); 
        });
        
        // 3. Gestion centralisée des Appels Entrants (Callee)
        peer.on("call", call => {
            showTopbarLog(`📞 Appel entrant de ${call.peer}.`);
            logActivity('CALL_INCOMING', `Appel reçu de ${call.peer}.`, call.peer);
            
            if (window.currentCall) {
                closeCurrentCall();
                showTopbarLog(`🔁 Fermeture de l'ancien appel avant de répondre.`);
            }
            window.currentCall = call;
            window.currentPartnerId = call.peer; 

            if (typeof window.updateLastPeers === 'function') {
                window.updateLastPeers(call.peer);
            }

            call.answer(window.localStream);
            
            call.on("stream", remoteStream => {
                const remoteVideo = document.getElementById("remoteVideo");
                if (remoteVideo) { remoteVideo.srcObject = remoteStream; remoteVideo.play(); }
                showTopbarLog(`✅ Appel entrant établi avec ${call.peer}.`);
                logActivity('STREAM_RECEIVE', 'Flux distant reçu.', call.peer);
            });
            
            call.on("close", closeCurrentCall);
             call.on("error", err => {
                console.error("❌ Appel entrant erreur:", err);
                logActivity('CALL_ERROR', `Erreur appel entrant: ${err.message}`, call.peer);
                closeCurrentCall();
            });
        });

        // 4. Gestion des connexions de données (si utilisées)
        peer.on("connection", c => {
            conn = c;
            conn.on("data", data => {
              showTopbarLog(`👂 Donnée de ${c.peer} : ${JSON.stringify(data)}`);
            });
        });

        // Gestion des erreurs et déconnexions PeerJS
        peer.on("error", err => {
          console.error("❌ PeerJS", err);
          logActivity('PEER_ERROR', `Erreur PeerJS: ${err.type}`);
          showTopbarLog(`❌ Erreur PeerJS : ${err.type}`);
        });

        peer.on("disconnected", () => {
          logActivity('PEER_DISCONNECTED', 'Déconnecté du serveur PeerJS. Tentative de reconnexion.');
          showTopbarLog("⚠ Déconnecté du serveur PeerJS");
          if (peer && !peer.destroyed) {
            peer.reconnect();
          }
        });
        
        peer.on("close", () => {
          unregisterPeer('Fermeture connexion PeerJS');
          showTopbarLog("🔒 Connexion PeerJS fermée");
        });
    }); // Fin de new Promise

    // --- LOGIQUE D'APPEL DIRECT ---
    const urlParams = new URLSearchParams(window.location.search);
    const partnerId = urlParams.get("partnerId");

    if (partnerId && partnerId !== window.myPeerId) {
        showTopbarLog("📞 Tentative d'appel direct initialisé par Annuaire...");
        setupOutgoingCall(partnerId, window.localStream);
    }
    // ------------------------------------------------------------------------------------

    // 🔔 Gérer la fermeture du navigateur/onglet (pour l'unregister)
    window.addEventListener('beforeunload', () => {
        unregisterPeer('Fermeture navigateur');
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

  // Fermer proprement l'appel précédent avant le shuffle
  if (window.currentCall) {
      closeCurrentCall();
  }
  if (conn) {
      conn.close();
      conn = null;
  }
  
  fetch(`${window.location.origin}/api/list-peers.php`)
    .then(r => r.json())
    .then(peerList => {
      // 1. Filtrer les pairs pour exclure soi-même
      const availablePeers = peerList.filter(p => p.peerId !== window.myPeerId);
      
      if (availablePeers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePeers.length);
        const partnerId = availablePeers[randomIndex].peerId;
        
        showTopbarLog(`🔗 Tentative d'appel vers ${partnerId} (Trouvé via Annuaire: ${availablePeers.length} actifs)`);
        setupOutgoingCall(partnerId, window.localStream);
      } else {
        showTopbarLog("❌ Aucun interlocuteur disponible (Annuaire vide ou vous êtes le seul)");
      }
    })
    .catch(err => {
      logActivity('SHUFFLE_ERROR', `Erreur recherche partenaire: ${err.message}`);
      showTopbarLog(`❌ Erreur Réseau/Annuaire : ${err.message}`);
      console.error("[MATCH]", err);
    });
}

export function bindMatchEvents() {
  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    btnNext.removeEventListener("click", nextMatch); 
    btnNext.addEventListener("click", nextMatch);
  }
}