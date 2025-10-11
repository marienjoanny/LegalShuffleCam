/**
 * APP.JS - Correction #33 (WebRTC Final Client)
 * Consolide la détection du visage, la signalisation WebRTC et le contrôle de l'UI.
 */

// --- Variables Globales / DOM ---
window.faceVisible = window.faceVisible || false; 

const btnNext = document.getElementById('btnNext');
const loaderRing = document.getElementById('loaderRing'); 
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let socket = null;
let peerConnection = null;
const ICE_SERVERS = []; // À configurer si nécessaire

if (btnNext) {
    btnNext.disabled = true; 
}

// --- Contrôle de l'Interface (Appelé par face-guard.js) ---
window.checkUIUpdate = function() {
    const faceReady = window.faceVisible;

    // Seul le contrôle du visage active le bouton
    if (btnNext) {
        // Le bouton n'est activé que si la connexion n'a pas démarré
        if (!socket || socket.disconnected) {
             btnNext.disabled = !faceReady;
             btnNext.textContent = faceReady ? '➡️ Interlocuteur suivant' : 'Visage requis';
        }
    }

    if (topBar) {
        // Si la recherche est déjà en cours, ne pas écraser le message
        if (topBar.textContent.startsWith("Recherche") || topBar.textContent.startsWith("Connecté")) return;

        if (faceReady) {
            topBar.textContent = "✅ Visage OK. Prêt à chercher un partenaire.";
            if (loaderRing) loaderRing.style.display = 'block';
        } else {
            topBar.textContent = "🔴 Visage non détecté/cadré.";
            if (loaderRing) loaderRing.style.display = 'none';
        }
    }
};

window.checkUIUpdate(); 


// --- Signalisation Socket.IO ---

function getSocket() {
    if (socket && typeof socket.on === 'function') return socket;
    if (window.io) { 
        try {
            socket = window.io(); 
            // Écoute des événements de matchmaking
            setupSocketListeners(socket);
            return socket; 
        } catch (e) {
            console.error('Socket.IO init error:', e);
        }
    }
    topBar.textContent = "❌ Erreur: Socket.IO non chargé.";
    return null;
};

function setupSocketListeners(s) {
    s.on('connect', () => { console.log('[Socket] Connecté au serveur.'); });
    s.on('disconnect', () => { console.log('[Socket] Déconnecté du serveur.'); });

    // Événements de Matchmaking (issus de main.js)
    s.on('waiting', () => {
        console.log('[MATCH] En attente d\'un partenaire.');
        topBar.textContent = 'Recherche d\'un partenaire en cours...';
        if (btnNext) { btnNext.textContent = 'En attente...'; btnNext.disabled = true; }
    });

    s.on('matched', (payload) => {
        console.log('[MATCH] Partenaire trouvé !', payload);
        topBar.textContent = 'Connecté à la salle ' + payload.roomId;
        if (btnNext) { btnNext.textContent = 'Connecté !'; btnNext.disabled = true; }

        // Démarrer la connexion WebRTC après le match
        // initiateWebRTC(payload.isInitiator, payload.remoteSocketId);
        
        // Pour l'instant on alerte juste
        alert('Match trouvé — room: ' + payload?.roomId); 
    });
    
    // Ajoutez ici les handlers WebRTC : 'offer', 'answer', 'ice-candidate'
}


// --- Logique WebRTC (À COMPLÉTER) ---

/*
function initiateWebRTC(isInitiator, remoteSocketId) {
    // 1. Création du PeerConnection
    peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // 2. Gestion des pistes (ajouter les pistes locales)
    localVideo.srcObject.getTracks().forEach(track => peerConnection.addTrack(track, localVideo.srcObject));

    // 3. Gestion de la piste distante
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };
    
    // 4. Gestion des candidats ICE pour le réseau
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { 
                candidate: event.candidate, 
                to: remoteSocketId 
            });
        }
    };

    // 5. Création de l'offre (si nous sommes l'initiateur)
    if (isInitiator) {
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                socket.emit('offer', { 
                    offer: peerConnection.localDescription,
                    to: remoteSocketId
                });
            });
    }
    
    // 6. Gestion des signaux entrants (offer, answer, candidate)
    // C'est ici que vous définissez les écouteurs de socket pour les signaux WebRTC
    // ...
}
*/


// --- GESTIONNAIRE D'ÉVÉNEMENT DU BOUTON FINAL ---

if (btnNext) {
    btnNext.addEventListener('click', function() {
        if (!btnNext.disabled && window.faceVisible) {
            console.log("Bouton Interlocuteur suivant cliqué.");
            
            // 1. Désactiver le bouton immédiatement
            btnNext.disabled = true; 
            btnNext.textContent = "Connexion...";

            // 2. Démarrer le processus de signalisation
            const s = getSocket();

            if (s) {
                // 3. Demander au serveur de nous mettre en file d'attente
                s.emit('joinQueue');
            } else {
                topBar.textContent = "❌ Connexion Socket échouée.";
                btnNext.textContent = "Réessayer";
                btnNext.disabled = false;
            }
        }
    });
}
