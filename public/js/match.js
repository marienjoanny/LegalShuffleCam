// LegalShuffleCam • match.js
// Gestion de la connexion PeerJS, de l'état des boutons et du consentement mutuel.

// Correction: getLocalStream n'est plus exporté, le flux est dans window.localStream
import { startCamera } from './camera.js'; 
import { stopFaceDetection } from './face-visible.js';

let peer = null;
let currentConnection = null;
let dataConnection = null; // Canal de données PeerJS
let heartbeatInterval = null; // Pour le ping périodique
window.myPeerId = null; // Notre ID de pair, doit être global
window.currentSessionId = crypto.randomUUID(); // Session ID généré au démarrage

// Définition des types de messages pour le canal de données
const MESSAGE_TYPES = {
    CONSENT_REQUEST: 'CONSENT_REQUEST',
    CONSENT_RESPONSE: 'CONSENT_RESPONSE'
};

// Éléments de l'interface (Initialisation dans bindMatchEvents)
let btnNext = null;
let btnConsentement = null;
let remoteVideo = null;
let remoteVideoContainer = null;
let localConsentModal = null;
let remoteConsentModal = null;

// --- UTILS API SERVER ---

/**
 * Fonction générique pour appeler les APIs PHP (register, unregister, ping).
 * @param {string} endpoint L'URL de l'API (ex: 'register-peer.php')
 * @param {object} data Données à envoyer (peerId, sessionId, etc.)
 */
function callPeerApi(endpoint, data = {}) {
    const url = `/public/api/${endpoint}`;
    const params = new URLSearchParams({ 
        peerId: window.myPeerId, 
        sessionId: window.currentSessionId, 
        ...data 
    }).toString();

    fetch(`${url}?${params}`, { method: 'GET' })
        .then(response => response.json())
        .then(result => {
            console.log(`[API] ${endpoint} Success:`, result);
        })
        .catch(error => {
            console.error(`[API] ${endpoint} Error:`, error);
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
            callPeerApi('ping-peer.php', { action: 'HEARTBEAT' });
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
        });
}

/**
 * Appelle l'API pour désenregistrer notre ID de pair.
 */
function unregisterPeer(reason = 'disconnect') {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    callPeerApi('unregister-peer.php', { reason: reason });
}

// --- LOGIQUE PEERJS ---

/**
 * Gère les messages entrants sur le canal de données.
 * ... (le reste de la fonction handleDataMessage est inchangé)
 */
function handleDataMessage(data) {
    if (!data || !data.type) {
        console.warn("[DATA] Message de données reçu invalide.", data);
        return;
    }

    const { type, payload } = data;
    console.log(`[DATA] Message reçu: ${type}`, payload);

    switch (type) {
        case MESSAGE_TYPES.CONSENT_REQUEST:
            // Le partenaire demande le consentement. Afficher la modale distante.
            showRemoteConsentModal(payload.requesterId);
            break;

        case MESSAGE_TYPES.CONSENT_RESPONSE:
            // Le partenaire a répondu à notre demande.
            handlePartnerConsentResponse(payload.response);
            break;

        default:
            console.warn(`[DATA] Type de message inconnu: ${type}`);
    }
}


/**
 * 1. Initialise la connexion PeerJS et récupère le flux média.
 */
export function initMatch() {
    window.showTopbar("⏳ Initialisation PeerJS...", "#3498db");
    
    // Initialiser Peer
    peer = new Peer(null, {
        host: 'peerjs-server.example.com', // À remplacer par votre propre serveur
        port: 443,
        secure: true
    });

    peer.on('open', (id) => {
        window.myPeerId = id; // Stocker l'ID globalement
        window.updatePeerIdDisplay(id);
        window.showTopbar(`✅ PeerJS OK. ID: ${id.substring(0, 8)}... En attente de la caméra.`, "#2ecc71");
        
        // --- NOUVEAU : Enregistrement du pair et démarrage du Heartbeat ---
        registerPeer(); 
        
        // Démarrer la caméra pour obtenir le flux local et lancer la détection faciale
        // L'appel à startCamera sans ID utilise le périphérique par défaut/sélectionné
        startCamera(); 
    });

    peer.on('error', (err) => {
        console.error("[PEER] Erreur PeerJS:", err);
        window.showTopbar(`❌ Erreur PeerJS: ${err.type}. Rechargez.`, "#c0392b");
    });
    
    // Écouter les appels entrants
    peer.on('call', (call) => {
        // Correction Patch 4: Utiliser window.localStream au lieu de getLocalStream()
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
export function nextMatch() {
    if (btnNext) btnNext.disabled = true; 
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

    // 3. Simuler la recherche du pair à appeler via l'annuaire
    // --- À IMPLÉMENTER : Logique d'appel à get-peers.php ou autre API de matching ---
    
    // Simulation du matching (Devra être remplacé par un fetch vers une API)
    fetch('/public/api/get-peer.php?exclude=' + window.myPeerId) // API simulée
        .then(res => res.json())
        .then(data => {
            if (data.peerIdToCall) {
                // Si un pair est trouvé, initier l'appel
                // Correction Patch 4: Utiliser window.localStream au lieu de getLocalStream()
                const localStream = window.localStream; 
                if (localStream) {
                    const call = peer.call(data.peerIdToCall, localStream);
                    // Créer le canal de données manuellement si on est l'appelant
                    const conn = peer.connect(data.peerIdToCall);
                    setupDataConnection(conn);
                    handleConnection(call);
                }
            } else {
                window.showTopbar("🤷‍♂️ Personne trouvée. Réessayez.", "#3498db");
                if (btnNext) btnNext.disabled = false; // Réactiver le bouton
            }
        })
        .catch(err => {
            console.error("Erreur de matching simulé:", err);
            window.showTopbar("❌ Erreur de l'API de matching. Réessayez.", "#c0392b");
            if (btnNext) btnNext.disabled = false; // Réactiver le bouton
        });
    // -----------------------------------------------------------------------------
    
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
    
    // Si nous sommes l'initiateur de l'appel (on a appelé call.peer()), on crée le canal de données 
    // s'il n'existe pas déjà (car PeerJS le crée parfois automatiquement).
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
        // --- NOUVEAU : Désenregistrement lors de la déconnexion d'un appel ---
        unregisterPeer('call_close'); 
        
        remoteVideo.srcObject = null;
        window.currentPartnerId = null;
        window.mutualConsentGiven = false; 
        window.showTopbar("Déconnecté. Cliquez sur 'Suivant' pour recommencer.", "#e74c3c");
        
        // Relancer l'enregistrement pour pouvoir être rappelé
        registerPeer(); 
    });
    
    // Le bouton "Suivant" est géré par la détection faciale ou par le consentement mutuel
    if (btnNext) btnNext.disabled = true;
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
    // 1. Désactiver la détection faciale
    stopFaceDetection(); 

    // 2. Mettre à jour l'état global et l'UI du bouton
    window.mutualConsentGiven = true;
    btnConsentement.textContent = "✅ Consentement OK";
    btnConsentement.classList.add('active');
    
    // 3. Activer le bouton Suivant de manière permanente
    if (btnNext) btnNext.disabled = false; 
    
    // 4. Retirer le flou de la vidéo distante
    remoteVideoContainer.classList.remove('blurred');
}


/**
 * Gère le changement de visibilité du visage.
 * Désactive/Active le bouton "Interlocuteur suivant" et "Wizz".
 */
function handleFaceVisibility(event) {
    const isVisible = event.detail.isVisible;
    
    // La détection faciale est ignorée si le consentement mutuel est donné
    if (window.mutualConsentGiven) {
        if (btnNext) btnNext.disabled = false; // Reste activé
        remoteVideoContainer.classList.remove('blurred');
        return;
    }
    
    if (btnNext) {
        const canConnect = isVisible; // Actif uniquement si visible ET non consenti
        btnNext.disabled = !canConnect;
    }
    
    const btnVibre = document.getElementById('btnVibre');
    if (btnVibre) {
         // Le Wizz est désactivé si le visage n'est pas détecté (mesure anti-spam)
         btnVibre.disabled = !isVisible; 
    }
    
    // Flouter la vidéo distante si le visage est perdu et le consentement non donné
    if (!isVisible) {
         remoteVideoContainer.classList.add('blurred');
    } else {
         remoteVideoContainer.classList.remove('blurred');
    }
}

/**
 * 4. Lie tous les événements d'interaction de l'interface.
 */
export function bindMatchEvents() {
    btnNext = document.getElementById('btnNext');
    btnConsentement = document.getElementById('btnConsentement');
    remoteVideo = document.getElementById('remoteVideo');
    remoteVideoContainer = document.getElementById('remoteVideoContainer');
    localConsentModal = document.getElementById('localConsentModal');
    remoteConsentModal = document.getElementById('remoteConsentModal');

    // Écouteur pour la détection faciale
    window.addEventListener('faceVisibilityChanged', handleFaceVisibility);
    
    // Écouteur pour le bouton "Interlocuteur suivant"
    if (btnNext) {
        btnNext.addEventListener('click', nextMatch);
        btnNext.disabled = true; // Désactivé jusqu'à la détection/consentement
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
    
    // Initialiser le flou pour dissuasion
    remoteVideoContainer.classList.add('blurred');
}

// Rendre la fonction globale pour l'appel direct dans index-real.php si besoin
window.nextMatch = nextMatch;
