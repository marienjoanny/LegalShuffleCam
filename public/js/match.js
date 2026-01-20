let peer = null;
let localStream = null;
let currentCall = null;
window.myPeerId = null;

// Extraction de l'ID généré par PHP pour synchroniser avec la BDD
const idDisplay = document.getElementById('peer-id-display');
const phpPeerId = idDisplay ? idDisplay.textContent.replace('ID: ', '').trim() : null;

async function startLocalVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('local-video').srcObject = localStream;
        initPeer();
    } catch (err) {
        console.error("Erreur caméra:", err);
        alert("La caméra est nécessaire pour utiliser le service.");
    }
}

function initPeer() {
    // Utilisation de l'ID PHP pour que l'annuaire soit correct
    peer = new Peer(phpPeerId, {
        host: 'legalshufflecam.ovh',
        port: 443,
        path: '/peerjs',
        secure: true,
        debug: 1
    });

    peer.on('open', (id) => {
        window.myPeerId = id;
        console.log('Connecté à PeerJS avec ID:', id);
        registerPeer(id);
    });

    peer.on('call', (call) => {
        console.log("Appel entrant reçu...");
        call.answer(localStream);
        handleCall(call);
    });

    peer.on('error', (err) => {
        console.error('Erreur PeerJS:', err.type);
    });
}

async function registerPeer(peerId) {
    try {
        await fetch('/api/register-peer.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ peerId: peerId })
        });
    } catch (err) {
        console.error("Erreur Register API:", err);
    }
}

async function nextMatch() {
    if (currentCall) {
        currentCall.close();
    }
    
    try {
        // Recherche d'un partenaire disponible dans la BDD
        const response = await fetch('/api/get-peer.php');
        const data = await response.json();

        if (data.peerId && data.peerId !== window.myPeerId) {
            console.log("Tentative d'appel vers:", data.peerId);
            const call = peer.call(data.peerId, localStream);
            handleCall(call);
        } else {
            console.log("Personne de disponible pour le moment.");
        }
    } catch (err) {
        console.error("Erreur lors du matching:", err);
    }
}

function handleCall(call) {
    currentCall = call;
    call.on('stream', (remoteStream) => {
        const remoteVideo = document.getElementById('remote-video');
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    startLocalVideo();
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextMatch);
    }
});

// Ping pour maintenir la présence dans annuaire.php
setInterval(async () => {
    if (window.myPeerId) {
        try {
            await fetch('/api/ping-peer.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ peerId: window.myPeerId })
            });
        } catch (e) {}
    }
}, 10000);
