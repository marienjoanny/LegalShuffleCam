// LegalShuffleCam • match.js
// Gestion de la connexion PeerJS, de l'état des boutons et du consentement mutuel.

let peer = null;
let currentConnection = null;
let dataConnection = null;
let heartbeatInterval = null;
window.myPeerId = null;
window.currentSessionId = crypto.randomUUID();
window.mutualConsentGiven = false;

// Définition des types de messages pour le canal de données
const MESSAGE_TYPES = {
    CONSENT_REQUEST: 'CONSENT_REQUEST',
    CONSENT_RESPONSE: 'CONSENT_RESPONSE',
    WIZZ: 'WIZZ'
};

// Éléments de l'interface
let btnNextPeer = null;
let btnConsentement = null;
let remoteVideo = null;
let remoteVideoContainer = null;
let localConsentModal = null;
let remoteConsentModal = null;


// --- UTILS DATA CHANNEL ---

function sendData(type, payload = {}) {
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

/**
 * Gère les messages DATA reçus du partenaire
 */
function handleDataMessage(data) {
    console.log("[DATA] Message reçu:", data);
    
    if (!data || !data.type) return;
    
    switch(data.type) {
        case MESSAGE_TYPES.CONSENT_REQUEST:
            showRemoteConsentModal(data.payload.requesterId);
            break;
            
        case MESSAGE_TYPES.CONSENT_RESPONSE:
            handlePartnerConsentResponse(data.payload.response);
            break;
            
        case MESSAGE_TYPES.WIZZ:
            if (window.showTopbar) window.showTopbar("🔔 Votre partenaire vous a envoyé un Wizz !", "#9b59b6");
            if (navigator.vibrate) navigator.vibrate(200);
            break;
            
        default:
            console.warn("[DATA] Type de message inconnu:", data.type);
    }
}


// --- UTILS API SERVER ---

function callPeerApi(endpoint, data = {}) {
    const url = `/api/${endpoint}`;

    const bodyParams = new URLSearchParams({ 
        peerId: window.myPeerId, 
        sessionId: window.currentSessionId, 
        ...data 
    });

    return fetch(url, {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: bodyParams.toString() 
    })
        .then(response => {
            if (!response.ok) {
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
            throw error; 
        });
}

function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    heartbeatInterval = setInterval(() => {
        if (window.myPeerId) {
            callPeerApi('ping-peer.php', { action: 'HEARTBEAT' }).catch(e => {
                console.warn("[HEARTBEAT] Échec du ping API:", e.message);
            });
        }
    }, 30000); 
    console.log("[HEARTBEAT] Démarré (intervalle 30s).");
}

function registerPeer() {
    callPeerApi('register-peer.php')
        .then(() => {
            startHeartbeat(); 
        })
        .catch(() => {
             if (window.showTopbar) {
                 window.showTopbar("❌ Erreur d'enregistrement API. Vérifiez votre backend.", "#e74c3c");
             }
        });
}

function unregisterPeer(reason = 'disconnect') {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    callPeerApi('unregister-peer.php', { reason: reason }).catch(e => {
        console.warn("[UNREGISTER] Échec de la désinscription:", e.message);
    });
}


// --- LOGIQUE PEERJS ---

function initMatch() {
    if (window.showTopbar) {
        window.showTopbar("⏳ Initialisation PeerJS...", "#3498db");
    }
    
    peer = new Peer(null, {
        host: 'legalshufflecam.ovh',
        port: 443,
        path: '/peerjs',
        secure: true
    });

    peer.on('open', (id) => {
        window.myPeerId = id;
        if (window.updatePeerIdDisplay) {
            window.updatePeerIdDisplay(id);
        }
        if (window.showTopbar) {
            window.showTopbar(`✅ PeerJS OK. ID: ${id.substring(0, 8)}... En attente de la caméra.`, "#2ecc71");
        }
        
        registerPeer(); 
        
        if (typeof startCamera === 'function') {
            startCamera();
        } else if (typeof window.startCamera === 'function') {
            window.startCamera();
        } else {
            console.error("[INIT] La fonction startCamera() n'est pas définie !");
        }
    });

    peer.on('error', (err) => {
        console.error("[PEER] Erreur PeerJS:", err);
        let msg = `❌ Erreur PeerJS: ${err.type}. `;
        if (window.showTopbar) window.showTopbar(msg, "#c0392b");
    });
    
    peer.on('call', (call) => {
        const localStream = window.localStream; 
        if (!localStream) {
            console.error("[PEER] Appel reçu mais pas de stream local disponible.");
            return;
        }
        
        call.answer(localStream); 
        handleConnection(call);
    });

    peer.on('connection', (conn) => {
        setupDataConnection(conn);
    });
    
    window.addEventListener('beforeunload', () => {
         unregisterPeer('window_close');
    });
}

function nextMatch() {
    if (window.showTopbar) {
        window.showTopbar("⏳ Recherche d'un nouvel interlocuteur...", "#f39c12");
    }
    
    if (currentConnection) {
        currentConnection.close();
        currentConnection = null;
    }
    if (dataConnection) {
        dataConnection.close();
        dataConnection = null;
    }
    
    unregisterPeer('next_match');
    registerPeer(); 

    fetch('/api/get-peer.php?exclude=' + window.myPeerId) 
        .then(res => {
            if (!res.ok) throw new Error(`API get-peer.php Erreur HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            if (data.peerIdToCall && data.peerIdToCall !== window.myPeerId) {
                const localStream = window.localStream; 
                if (localStream) {
                    const call = peer.call(data.peerIdToCall, localStream);
                    const conn = peer.connect(data.peerIdToCall);
                    setupDataConnection(conn);
                    handleConnection(call);
                } else {
                    if (window.showTopbar) window.showTopbar("❌ Erreur: Caméra non initialisée.", "#c0392b");
                }
            } else {
                if (window.showTopbar) window.showTopbar("🤷‍♂️ Personne trouvée. Réessayez.", "#3498db");
                if (btnNextPeer) btnNextPeer.disabled = false;
            }
        })
        .catch(err => {
            console.error("Erreur de matching:", err);
            if (btnNextPeer) btnNextPeer.disabled = false;
        });
    
    window.mutualConsentGiven = false;
}

function setupDataConnection(conn) {
    dataConnection = conn;
    dataConnection.on('open', () => console.log("[DATA] Canal ouvert."));
    dataConnection.on('data', handleDataMessage);
    dataConnection.on('close', () => dataConnection = null);
}

function handleConnection(call) {
    if (currentConnection) currentConnection.close(); 
    currentConnection = call;
    window.currentPartnerId = call.peer;
    
    if (window.showTopbar) window.showTopbar(`🤝 Connecté !`, "#2ecc71");
    if (window.updateLastPeers) window.updateLastPeers(call.peer);
    
    if (!dataConnection || dataConnection.peer !== call.peer) {
         const conn = peer.connect(call.peer);
         setupDataConnection(conn);
    }
    
    if (btnConsentement) {
        btnConsentement.textContent = "👍 Consentement";
        btnConsentement.classList.remove('active');
    }
    
    call.on('stream', (stream) => {
        if (remoteVideo) {
            remoteVideo.srcObject = stream;
            remoteVideo.onloadedmetadata = () => remoteVideo.play();
        }
    });

    call.on('close', () => {
        unregisterPeer('call_close'); 
        if (remoteVideo) remoteVideo.srcObject = null;
        window.currentPartnerId = null;
        window.mutualConsentGiven = false;
        if (btnNextPeer) btnNextPeer.disabled = false;
    });
}

function logMutualConsent(status) {
    callPeerApi('report-handler.php', {
        action: 'log_consent',
        consentStatus: status,
        partnerId: window.currentPartnerId || 'N/A'
    });
}

function showLocalConsentModal() {
    if (!window.currentPartnerId) return;
    if (localConsentModal) localConsentModal.style.display = 'flex';

    document.getElementById('btnConsentYes').onclick = () => {
        if (localConsentModal) localConsentModal.style.display = 'none';
        sendData(MESSAGE_TYPES.CONSENT_REQUEST, { requesterId: window.myPeerId });
    };

    document.getElementById('btnConsentNo').onclick = () => {
        if (localConsentModal) localConsentModal.style.display = 'none';
    };
}

function showRemoteConsentModal(partnerId) {
    if (!remoteConsentModal) return;
    remoteConsentModal.style.display = 'flex';
    
    const messageEl = document.getElementById('consentPartnerMessage');
    if (messageEl) messageEl.textContent = `ID: ${partnerId.substring(0, 8)}...`;
    
    const sendResponse = (response) => {
        remoteConsentModal.style.display = 'none';
        sendData(MESSAGE_TYPES.CONSENT_RESPONSE, { response: response });
        if (response === 'yes') {
            logMutualConsent('ACCORDED_VIA_RESPONSE');
            completeMutualConsent();
        }
    };

    document.getElementById('remoteConsentYes').onclick = () => sendResponse('yes');
    document.getElementById('remoteConsentNo').onclick = () => sendResponse('no');
}

function handlePartnerConsentResponse(response) {
    if (response === 'yes') {
        logMutualConsent('ACCORDED_VIA_REQUEST');
        completeMutualConsent();
    }
}

function completeMutualConsent() {
    if (typeof stopFaceDetection === 'function') stopFaceDetection();
    window.mutualConsentGiven = true;
    if (btnConsentement) {
        btnConsentement.textContent = "✅ Consentement OK";
        btnConsentement.classList.add('active');
    }
    if (btnNextPeer) btnNextPeer.disabled = false;
    if (remoteVideoContainer) remoteVideoContainer.classList.remove('blurred');
}

function handleFaceVisibility(event) {
    const isVisible = event.detail.isVisible;
    if (window.mutualConsentGiven) return;
    
    if (btnNextPeer) btnNextPeer.disabled = !isVisible;
    if (remoteVideoContainer) {
        isVisible ? remoteVideoContainer.classList.remove('blurred') : remoteVideoContainer.classList.add('blurred');
    }
}

function bindMatchEvents() {
    btnNextPeer = document.getElementById('btnNextPeer');
    btnConsentement = document.getElementById('btnConsentement');
    remoteVideo = document.getElementById('remoteVideo');
    remoteVideoContainer = document.getElementById('remoteVideoContainer');
    localConsentModal = document.getElementById('consentModal');
    remoteConsentModal = document.getElementById('remoteConsentModal');

    window.addEventListener('faceVisibilityChanged', handleFaceVisibility);
    
    if (btnNextPeer) {
        btnNextPeer.addEventListener('click', nextMatch);
        btnNextPeer.disabled = true;
    }
    if (btnConsentement) btnConsentement.addEventListener('click', showLocalConsentModal);
    
    const btnVibre = document.getElementById('btnVibre');
    if (btnVibre) {
        btnVibre.addEventListener('click', () => {
            if (window.currentPartnerId) sendData(MESSAGE_TYPES.WIZZ);
        });
    }
}

window.nextMatch = nextMatch;
window.bindMatchEvents = bindMatchEvents;
window.initMatch = initMatch;
