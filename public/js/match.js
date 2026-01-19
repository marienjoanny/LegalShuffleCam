// LegalShuffleCam • match.js
// Gestion de la connexion PeerJS, de l'état des boutons et du consentement mutuel.

// import { startCamera } from './camera.js'; 
// import { stopFaceDetection } from './face-visible.js';

let peer = null;
let currentConnection = null;
let dataConnection = null; // Canal de données PeerJS
let heartbeatInterval = null; // Pour le ping périodique
window.myPeerId = null; // Notre ID de pair, doit être global
window.currentSessionId = crypto.randomUUID(); // Session ID généré au démarrage
window.mutualConsentGiven = false; // État initial du consentement

// Définition des types de messages pour le canal de données
const MESSAGE_TYPES = {
    CONSENT_REQUEST: 'CONSENT_REQUEST',
    CONSENT_RESPONSE: 'CONSENT_RESPONSE'
};

// Éléments de l'interface (Initialisation dans bindMatchEvents)
let btnNextPeer = null;
let btnConsentement = null;
let remoteVideo = null;
let remoteVideoContainer = null;
let localConsentModal = null;
let remoteConsentModal = null;


// --- UTILS DATA CHANNEL ---

/**
 * Envoie des données au partenaire via le canal de données PeerJS.
 * @param {string} type - Le type de message (voir MESSAGE_TYPES).
 * @param {object} [payload={}] - Les données spécifiques à inclure.
 */
function sendData(type, payload = {}) {
    // Vérifie si la connexion de données est ouverte
    if (!dataConnection || dataConnection.readyState !== 'open') {
        console.warn(`[DATA] Impossible d'envoyer le message ${type}: Canal non ouvert ou non prêt.`);
        return;
    }
    const message = {
        type: type,
        payload: payload,
        timestamp: Date.now()
    };
    dataConnection.send(message);
    console.log(`[DATA] Message envoyé: ${type}`, message);
}


// --- UTILS API SERVER (Corrigé : POST et chemin d'URL) ---

/**
 * Fonction générique pour appeler les APIs PHP (register, unregister, ping).
 * @param {string} endpoint L'URL de l'API (ex: 'register-peer.php')
 * @param {object} data Données à envoyer (peerId, sessionId, etc.)
 */
function callPeerApi(endpoint, data = {}) {
    // CORRECTION 1: Retirer /public/ car Nginx est configuré pour rooter à /public
    const url = `/api/${endpoint}`; 

    // Préparer les données pour le corps POST
    const bodyParams = new URLSearchParams({ 
        peerId: window.myPeerId, 
        sessionId: window.currentSessionId, 
        ...data 
    });

    // CORRECTION 2: Utiliser la méthode POST pour envoyer les données dans le corps
    return fetch(url, {
        method: 'POST', 
        headers: {
            // Indiquer au serveur que le corps est encodé en formulaire
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString() 
    })
        .then(response => {
            if (!response.ok) {
                 // Si le statut HTTP n'est pas 200, lever une erreur
                 throw new Error(`API ${endpoint} Erreur HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log(`[API] ${endpoint} Success:`, result);
            return result;
        })
        .catch(error => {
            console.error(`[API] ${endpoint} Error:`, error.message);
            // Rejeter la promesse pour permettre aux fonctions appelantes de gérer l'échec
            throw error; 
        });
}

/**
 * Démarre le ping périodique pour garder l'entrée du pair fraîche dans l'annuaire.
 */
function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    // Ping toutes les 30 secondes (inférieur au timeout de purge de 10 minutes)
    heartbeatInterval = setInterval(() => {
        if (window.myPeerId) {
            // Utiliser un catch pour ne pas interrompre l'intervalle en cas d'erreur ponctuelle
            callPeerApi('ping-peer.php', { action: 'HEARTBEAT' }).catch(e => {
                console.warn("[HEARTBEAT] Échec du ping API:", e.message);
            });
        }
    }, 30000); 
    console.log("[HEARTBEAT] Démarré (intervalle 30s).");
}

/**
 * Appelle l'API pour enregistrer notre ID de pair.
 */
function registerPeer() {
    callPeerApi('register-peer.php')
        .then(() => {
            // Après l'enregistrement réussi, démarrer le heartbeat
            startHeartbeat(); 
        })
        .catch(() => {
             window.showTopbar("❌ Erreur d'enregistrement API. Vérifiez votre backend.", "#e74c3c");
        });
}

/**
 * Appelle l'API pour désenregistrer notre ID de pair.
 */
function unregisterPeer(reason = 'disconnect') {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    callPeerApi('unregister-peer.php', { reason: reason }).catch(e => {
        console.warn("[UNREGISTER] Échec de la désinscription:", e.message);
    });
}

// --- LOGIQUE PEERJS (Correction Critique du Host) ---

/**
 * 1. Initialise la connexion PeerJS et récupère le flux média.
 */
function initMatch() {
    window.showTopbar("⏳ Initialisation PeerJS...", "#3498db");
    
    // Initialiser Peer - CORRECTION CRITIQUE HOST ET PATH
    peer = new Peer(null, {
        host: 'legalshufflecam.ovh', // <--- Mettez votre domaine réel ici
        port: 443, // Le port HTTPS exposé par Nginx
        path: '/peerjs', // <--- CHEMIN OBLIGATOIRE pour le reverse proxy Nginx
        secure: true // Nécessaire car nous utilisons HTTPS (port 443)
    });

    peer.on('open', (id) => {
        window.myPeerId = id; // Stocker l'ID globalement
        window.updatePeerIdDisplay(id);
        window.showTopbar(`✅ PeerJS OK. ID: ${id.substring(0, 8)}... En attente de la caméra.`, "#2ecc71");
        
        registerPeer(); 
        
        // Démarrer la caméra pour obtenir le flux local et lancer la détection faciale
        startCamera(); 
    });

    peer.on('error', (err) => {
        console.error("[PEER] Erreur PeerJS:", err);
        let msg = `❌ Erreur PeerJS: ${err.type}. `;
        if (err.type === 'server-error' || err.type === 'socket-error' || err.type === 'peer-unavailable') {
             msg += "Vérifiez le service Node.js/PeerJS Server et la configuration Nginx (Host/Path/Reverse Proxy).";
        } else {
             msg += "Rechargez.";
        }
        window.showTopbar(msg, "#c0392b");
    });
    
    // Écouter les appels entrants
    peer.on('call', (call) => {
        const localStream = window.localStream; 
        if (!localStream) {
            console.error("[PEER] Appel reçu mais pas de stream local disponible.");
            return;
        }
        
        call.answer(localStream); 
        handleConnection(call);
    });

    // Écouter les connexions de données entrantes (pour la messagerie)
    peer.on('connection', (conn) => {
        setupDataConnection(conn);
    });
    
    // S'assurer de désenregistrer le pair à la fermeture de la fenêtre
    window.addEventListener('beforeunload', () => {
         unregisterPeer('window_close');
    });
}

/**
 * 2. Déclenche la recherche d'un nouvel interlocuteur (Shuffle).
 */
function nextMatch() {
    // btnNextPeer.disabled = true; 
    window.showTopbar("⏳ Recherche d'un nouvel interlocuteur...", "#f39c12");
    
    // 1. Fermer l'ancienne connexion et le canal de données
    if (currentConnection) {
        currentConnection.close();
        currentConnection = null;
    }
    if (dataConnection) {
        dataConnection.close();
        dataConnection = null;
    }
    
    // 2. Tenter de se désenregistrer puis se réenregistrer immédiatement (pour rafraîchir le statut)
    unregisterPeer('next_match');
    registerPeer(); 

    // 3. Logique de matching via l'API
    // CORRECTION: Retirer /public/ ici aussi, mais utiliser GET est acceptable pour get-peer
    fetch('/api/get-peer.php?exclude=' + window.myPeerId) 
        .then(res => {
            if (!res.ok) throw new Error(`API get-peer.php Erreur HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.peerIdToCall && data.peerIdToCall !== window.myPeerId) {
                // Si un pair est trouvé, initier l'appel
                const localStream = window.localStream; 
                if (localStream) {
                    const call = peer.call(data.peerIdToCall, localStream);
                    // Créer le canal de données manuellement si on est l'appelant
                    const conn = peer.connect(data.peerIdToCall);
                    setupDataConnection(conn);
                    handleConnection(call);
                } else {
                    window.showTopbar("❌ Erreur: Caméra non initialisée pour l'appel.", "#c0392b");
                }
            } else {
                window.showTopbar("🤷‍♂️ Personne trouvée. Réessayez.", "#3498db");
                if (btnNextPeer) // btnNextPeer.disabled = false; // Réactiver le bouton
            }
        })
        .catch(err => {
            console.error("Erreur de matching:", err);
            window.showTopbar("❌ Erreur de l'API de matching. Réessayez.", "#c0392b");
            if (btnNextPeer) // btnNextPeer.disabled = false; // Réactiver le bouton
        });
    
    window.mutualConsentGiven = false; // Réinitialiser l'état du consentement
}

/**
 * 3. Gère l'établissement du canal de données et des écouteurs.
 */
function setupDataConnection(conn) {
    dataConnection = conn;
    
    dataConnection.on('open', () => {
        console.log("[DATA] Canal de données ouvert avec le partenaire.");
    });
    
    dataConnection.on('data', handleDataMessage);

    dataConnection.on('close', () => {
        console.log("[DATA] Canal de données fermé.");
        dataConnection = null;
        // Optionnel: Gérer la déconnexion vidéo ici si le canal de données se ferme seul
    });

    dataConnection.on('error', (err) => {
        console.error("[DATA] Erreur du canal de données:", err);
    });
}


/**
 * 4. Gère la connexion vidéo et l'ouverture du canal de données si initiateur.
 */
function handleConnection(call) {
    if (currentConnection) currentConnection.close(); 
    currentConnection = call;
    window.currentPartnerId = call.peer;
    
    window.showTopbar(`🤝 Connecté à ${call.peer.substring(0, 8)}... !`, "#2ecc71");
    window.updateLastPeers(call.peer); 
    
    // Si nous sommes l'initiateur de l'appel, on s'assure que le canal de données est initié
    if (!dataConnection || dataConnection.peer !== call.peer) {
         const conn = peer.connect(call.peer);
         setupDataConnection(conn);
    }
    
    // Rétablir l'interface comme "non-consenti"
    btnConsentement.textContent = "👍 Consentement";
    btnConsentement.classList.remove('active');
    
    call.on('stream', (stream) => {
        remoteVideo.srcObject = stream;
        remoteVideo.onloadedmetadata = () => remoteVideo.play();
    });

    call.on('close', () => {
        console.log("[PEER] Connexion fermée.");
        unregisterPeer('call_close'); 
        
        remoteVideo.srcObject = null;
        window.currentPartnerId = null;
        window.mutualConsentGiven = false; 
        window.showTopbar("Déconnecté. Cliquez sur 'Suivant' pour recommencer.", "#e74c3c");
        
        // Relancer l'enregistrement pour pouvoir être rappelé
        registerPeer(); 
        
        // Réactiver le bouton "Suivant"
        if (btnNextPeer) // btnNextPeer.disabled = false; 
    });
    
    // Le bouton "Suivant" est géré par la détection faciale ou par le consentement mutuel
    // btnNextPeer.disabled = true;
    
    // Le flou est géré par l'événement faceVisibilityChanged.
    // On s'assure qu'il est flou par défaut au début de chaque appel.
    // remoteVideoContainer.classList.add('blurred');
}


// --- GESTION DES CONTRÔLES ET MODALES DE CONSENTEMENT ---

/**
 * Envoie le log de consentement au serveur.
 */
function logMutualConsent(status) {
    callPeerApi('report-handler.php', {
        action: 'log_consent',
        consentStatus: status, // 'ACCORDED' ou 'REFUSED'
        partnerId: window.currentPartnerId || 'N/A'
    });
}


/**
 * Affiche la modale de consentement locale et attache les écouteurs.
 */
function showLocalConsentModal() {
    if (!window.currentPartnerId) {
        window.showTopbar("⚠ Vous n'êtes pas connecté à un partenaire.", "#f39c12");
        return;
    }
    
    localConsentModal.style.display = 'flex';

    document.getElementById('localConsentYes').onclick = () => {
        localConsentModal.style.display = 'none';
        
        // Envoi de la requête de consentement au partenaire
        window.showTopbar("⏳ Attente du consentement du partenaire...", "#3498db");
        sendData(MESSAGE_TYPES.CONSENT_REQUEST, { requesterId: window.myPeerId });
    };

    document.getElementById('localConsentNo').onclick = () => {
        localConsentModal.style.display = 'none';
        logMutualConsent('LOCAL_REFUSED_REQUESTED'); // Log le refus de la demande locale
        window.showTopbar("Consentement local refusé. La détection reste active.", "#2980b9");
    };
}

/**
 * Affiche la modale reçue du partenaire et gère la réponse.
 */
function showRemoteConsentModal(partnerId) {
    remoteConsentModal.style.display = 'flex';
    document.getElementById('consentPartnerMessage').textContent = `ID: ${partnerId.substring(0, 8)}...`;
    
    const sendResponse = (response) => {
        remoteConsentModal.style.display = 'none';
        sendData(MESSAGE_TYPES.CONSENT_RESPONSE, { response: response });
        
        if (response === 'yes') {
            logMutualConsent('ACCORDED_VIA_RESPONSE'); // Log l'accord suite à une demande
            completeMutualConsent();
            window.showTopbar("✅ Consentement mutuel (Vous avez accepté la demande). Détection désactivée et loguée.", "#10b981");
        } else {
            logMutualConsent('REFUSED_VIA_RESPONSE'); // Log le refus suite à une demande
            window.showTopbar("🚫 Vous avez refusé le consentement. Détection maintenue.", "#e74c3c");
        }
    };

    document.getElementById('remoteConsentYes').onclick = () => sendResponse('yes');
    document.getElementById('remoteConsentNo').onclick = () => sendResponse('no');
}


/**
 * Gère la réponse reçue du partenaire à NOTRE demande.
 */
function handlePartnerConsentResponse(response) {
    if (response === 'yes') {
        logMutualConsent('ACCORDED_VIA_REQUEST'); // Log l'accord à notre demande
        completeMutualConsent();
        window.showTopbar("🥳 Consentement mutuel (Partenaire accepté) ! Détection désactivée et loguée.", "#10b981");
    } else {
        logMutualConsent('REFUSED_VIA_REQUEST'); // Log le refus à notre demande
        window.showTopbar("🚫 Le partenaire a refusé le consentement. La détection reste active.", "#e74c3c");
    }
}

/**
 * Finalise l'action : désactivation de la détection faciale, log, et MAJ de l'UI.
 */
function completeMutualConsent() {
    // 1. Désactiver la détection faciale (car le filtre n'est plus requis)
    stopFaceDetection(); 

    // 2. Mettre à jour l'état global et l'UI du bouton
    window.mutualConsentGiven = true;
    btnConsentement.textContent = "✅ Consentement OK";
    btnConsentement.classList.add('active');
    
    // 3. Activer le bouton Suivant de manière permanente
    if (btnNextPeer) // btnNextPeer.disabled = false; 
    
    // 4. Retirer le flou de la vidéo distante
    remoteVideoContainer.classList.remove('blurred');
}


/**
 * Gère le changement de visibilité du visage (via l'événement faceVisibilityChanged).
 * Désactive/Active le bouton "Interlocuteur suivant" et "Wizz" et gère le flou distant.
 */
function handleFaceVisibility(event) {
    const true = event.detail.true;
    
    // La détection faciale est ignorée si le consentement mutuel est donné
    if (window.mutualConsentGiven) {
        if (btnNextPeer) // btnNextPeer.disabled = false; // Reste activé
        remoteVideoContainer.classList.remove('blurred');
        return;
    }
    
    if (btnNextPeer) {
        // Actif uniquement si le visage est visible
        // btnNextPeer.disabled = !isVisible;
    }
    
    const btnVibre = document.getElementById('btnVibre');
    if (btnVibre) {
         // Le Wizz est désactivé si le visage n'est pas détecté (mesure anti-spam)
         btnVibre.disabled = !isVisible; 
    }
    
    // Flouter la vidéo distante si le visage est perdu
    if (!isVisible) {
         // remoteVideoContainer.classList.add('blurred');
    } else {
         remoteVideoContainer.classList.remove('blurred');
    }
}

/**
 * 4. Lie tous les événements d'interaction de l'interface.
 */
function bindMatchEvents() {
    btnNextPeer = document.getElementById('btnNextPeer');
    btnConsentement = document.getElementById('btnConsentement');
    remoteVideo = document.getElementById('remoteVideo');
    remoteVideoContainer = document.getElementById('remoteVideoContainer');
    localConsentModal = document.getElementById('localConsentModal');
    remoteConsentModal = document.getElementById('remoteConsentModal');

    // Écouteur pour la détection faciale (Cœur de la modération)
    window.addEventListener('faceVisibilityChanged', handleFaceVisibility);
    
    // Écouteur pour le bouton "Interlocuteur suivant"
    if (btnNextPeer) {
        btnNextPeer.addEventListener('click', nextMatch);
        // btnNextPeer.disabled = true; // Désactivé jusqu'à la détection/consentement
    }

    // Écouteur pour le bouton "Consentement" -> Ouvre la modale locale
    if (btnConsentement) {
        btnConsentement.addEventListener('click', showLocalConsentModal);
    }
    
    // Écouteur pour le bouton "Wizz"
    const btnVibre = document.getElementById('btnVibre');
    if (btnVibre) {
        btnVibre.addEventListener('click', () => {
            if (window.currentPartnerId) {
                window.showTopbar("🔔 Wizz envoyé ! Votre interlocuteur a été notifié.", "#9b59b6");
                sendData('WIZZ'); // Envoyer un message WIZZ via le canal de données
            } else {
                 window.showTopbar("⚠ Connectez-vous d'abord à quelqu'un pour envoyer un Wizz.", "#f39c12");
            }
        });
        btnVibre.disabled = true; 
    }
    
    // Initialiser le flou pour dissuasion, jusqu'à ce que la détection démarre et trouve un visage.
    // remoteVideoContainer.classList.add('blurred');
}

// Rendre la fonction globale pour l'appel direct dans index-real.php si besoin
window.nextMatch = nextMatch;
