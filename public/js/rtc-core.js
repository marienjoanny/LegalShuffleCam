// LegalShuffleCam • rtc-core.js
// Gestion des connexions WebRTC avec identifiants TURN dynamiques (LT-Cred)

// Variable globale pour la connexion WebRTC
let peerConnection;
let remoteId;
let negotiationTimeout;
let globalRtcConfig;

/**
 * Crée la configuration WebRTC (rtcConfig) avec les identifiants TURN dynamiques.
 * @param {Object} credentials - Contient { username, password } générés par le serveur.
 * @returns {Object} La configuration RTCPeerConnection.
 */
function createRtcConfig(credentials) {
    if (!credentials || !credentials.username || !credentials.password) {
        console.error("[RTC] Identifiants TURN incomplets ou manquants.");
        // Utiliser uniquement STUN comme solution de repli si TURN échoue
        return {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ],
            iceTransportPolicy: 'all',
            sdpSemantics: 'unified-plan'
        };
    }

    return {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            // Configuration UDP (Port 3478)
            {
                urls: 'turn:legalshufflecam.ovh:3478?transport=udp',
                username: credentials.username,
                credential: credentials.password,
                credentialType: 'password'
            },
            // Configuration TLS/TCP (Ports 5349 et 443)
            {
                urls: 'turns:legalshufflecam.ovh:5349',
                username: credentials.username,
                credential: credentials.password,
                credentialType: 'password'
            },
            {
                urls: 'turns:legalshufflecam.ovh:443',
                username: credentials.username,
                credential: credentials.password,
                credentialType: 'password'
            }
        ],
        iceTransportPolicy: 'all', // Permet STUN et RELAY
        sdpSemantics: 'unified-plan'
    };
}


// --- Fonctions RTC principales ---

/**
 * Fonction principale d'initialisation appelée par app.js.
 * Stocke la configuration et les flux locaux.
 * @param {MediaStream} stream - Flux média local.
 * @param {Object} turnCredentials - Identifiants LT-Cred (username, password).
 */
window.connectSocketAndWebRTC = function(stream, turnCredentials) {
    window.currentStream = stream;
    globalRtcConfig = createRtcConfig(turnCredentials);
    console.log("[RTC] Configuration WebRTC LT-Cred stockée pour les appels futurs.");
};

// Fonction pour démarrer un appel WebRTC (l'offreur)
window.startCall = async function(partnerId) {
    remoteId = partnerId;
    console.log('[RTC] Démarrage d\'un appel avec', remoteId);

    try {
        if (!window.currentStream || !globalRtcConfig) {
            console.error('[RTC] Erreur : Flux média ou configuration RTC manquant.');
            window.dispatchEvent(new CustomEvent('rtcError', {
                detail: { message: "Flux média ou configuration RTC manquant." }
            }));
            return;
        }

        // Utilise la configuration dynamique stockée
        peerConnection = new RTCPeerConnection(globalRtcConfig);
        setupPeerConnectionEvents();

        // Ajoute les pistes locales
        console.log('[RTC] Ajout des pistes locales :', window.currentStream.getTracks());
        window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));

        // Crée une offre
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        console.log('[RTC] Offre créée et envoyée à', remoteId);
        window.socket.emit("offer", { to: remoteId, sdp: offer.sdp });

        // Timeout pour éviter les blocages
        negotiationTimeout = setTimeout(() => {
            console.warn('[RTC] Timeout : Négociation WebRTC trop longue.');
            window.dispatchEvent(new CustomEvent('rtcError', {
                detail: { message: "La connexion a expiré. Réessayez." }
            }));
        }, 10000);

    } catch (err) {
        console.error('[RTC] Erreur lors de la création de l\'offre :', err);
        window.dispatchEvent(new CustomEvent('rtcError', {
            detail: { message: "Erreur lors de la création de l'offre WebRTC.", error: err }
        }));
    }
};

// Fonction pour gérer une offre reçue (le répondeur)
window.handleOffer = async function({ from, sdp }) {
    remoteId = from;
    console.log('[RTC] Offre reçue de', remoteId);

    try {
        if (!window.currentStream || !globalRtcConfig) {
            console.error('[RTC] Erreur : Flux média ou configuration RTC manquant.');
            window.dispatchEvent(new CustomEvent('rtcError', {
                detail: { message: "Flux média ou configuration RTC manquant." }
            }));
            return;
        }

        // Utilise la configuration dynamique stockée
        peerConnection = new RTCPeerConnection(globalRtcConfig);
        setupPeerConnectionEvents();

        // Ajoute les pistes locales
        console.log('[RTC] Ajout des pistes locales :', window.currentStream.getTracks());
        window.currentStream.getTracks().forEach(track => peerConnection.addTrack(track, window.currentStream));

        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sdp }));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        console.log('[RTC] Réponse créée et envoyée à', remoteId);
        window.socket.emit("answer", { to: remoteId, sdp: answer.sdp });
        clearTimeout(negotiationTimeout);

    } catch (err) {
        console.error('[RTC] Erreur lors de la gestion de l\'offre :', err);
        window.dispatchEvent(new CustomEvent('rtcError', {
            detail: { message: "Erreur lors de la gestion de l'offre WebRTC.", error: err }
        }));
    }
};

// Fonction pour gérer une réponse reçue
window.handleAnswer = async function({ sdp }) {
    try {
        console.log('[RTC] Réponse reçue.');
        await peerConnection.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: sdp }));
        clearTimeout(negotiationTimeout);
    } catch (err) {
        console.error('[RTC] Erreur lors de la gestion de la réponse :', err);
        window.dispatchEvent(new CustomEvent('rtcError', {
            detail: { message: "Erreur lors de la gestion de la réponse WebRTC.", error: err }
        }));
    }
};

// Fonction pour gérer un candidat ICE reçu
window.handleICECandidate = async function({ candidate }) {
    try {
        // console.log('[RTC] Candidat ICE reçu :', candidate);
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
        // Souvent un avertissement pour les candidats tardifs/dupliqués, peut être ignoré
        console.warn('[RTC] Candidat ICE ignoré ou tardif :', err);
    }
};

// Fonction pour déconnecter WebRTC
window.disconnectWebRTC = function() {
    if (peerConnection) {
        console.log('[RTC] Déconnexion WebRTC.');
        peerConnection.close();
        peerConnection = null;
        remoteId = null;
        globalRtcConfig = null; // Réinitialise la configuration pour forcer l'obtention de nouveaux LT-Cred si besoin
        clearTimeout(negotiationTimeout);
        window.dispatchEvent(new CustomEvent('rtcDisconnected', {
            detail: { message: "Connexion WebRTC terminée." }
        }));
    }
};

// Fonction pour configurer tous les écouteurs d'événements de la PeerConnection
function setupPeerConnectionEvents() {
    // Gestion des candidats ICE
    peerConnection.onicecandidate = e => {
        if (e.candidate) {
            const candidateStr = e.candidate.candidate;
            // console.log('[RTC] Nouveau candidat ICE :', candidateStr);
            if (candidateStr.includes('typ relay')) {
                console.log('[RTC] ✅ Candidat RELAY trouvé !');
            } else if (candidateStr.includes('typ srflx')) {
                console.log('[RTC] Candidat SRFLX (STUN) trouvé.');
            } else if (candidateStr.includes('typ host')) {
                console.log('[RTC] Candidat HOST trouvé.');
            }
            window.socket.emit("ice-candidate", { to: remoteId, candidate: e.candidate });
        } else {
            console.log('[RTC] Fin de la collecte des candidats ICE.');
        }
    };

    // Gestion des flux distants
    peerConnection.ontrack = e => {
        console.log('[RTC] Flux distant reçu !');
        if (document.getElementById('remoteVideo')) {
            document.getElementById('remoteVideo').srcObject = e.streams[0];
        }
        window.dispatchEvent(new CustomEvent('rtcConnected', {
            detail: { message: "Flux distant reçu." }
        }));
    };

    // Gestion des changements d'état de connexion globale
    peerConnection.onconnectionstatechange = () => {
        console.log('[RTC] État de la connexion:', peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
            window.dispatchEvent(new CustomEvent('rtcConnected', {
                detail: { message: "Connexion WebRTC établie." }
            }));
            clearTimeout(negotiationTimeout);
        } else if (peerConnection.connectionState === 'failed') {
            console.error('[RTC] Échec de la connexion WebRTC.');
            window.dispatchEvent(new CustomEvent('rtcError', {
                detail: { message: "Échec de la connexion WebRTC." }
            }));
        } else if (peerConnection.connectionState === 'checking') {
            console.log('[RTC] Vérification de la connexion en cours...');
        }
    };

    // Gestion des changements d'état ICE
    peerConnection.oniceconnectionstatechange = () => {
        console.log('[RTC] État ICE:', peerConnection.iceConnectionState);
        if (peerConnection.iceConnectionState === 'failed') {
            console.error('[RTC] Échec de la connexion ICE.');
            window.dispatchEvent(new CustomEvent('rtcError', {
                detail: { message: "Échec de la connexion WebRTC. Vérifiez votre réseau." }
            }));
        } else if (peerConnection.iceConnectionState === 'checking') {
            console.log('[RTC] Vérification de la connexion ICE en cours...');
        } else if (peerConnection.iceConnectionState === 'connected') {
            console.log('[RTC] Connexion ICE établie.');
        }
    };
}

// Fonction pour vérifier l'état de la connexion (pour le débogage)
window.checkConnectionStatus = function() {
    if (peerConnection) {
        console.log('[RTC] État actuel de la connexion:', peerConnection.connectionState);
        console.log('[RTC] État actuel ICE:', peerConnection.iceConnectionState);
    } else {
        console.log('[RTC] Aucune connexion WebRTC active.');
    }
};