// /public/js/utilities.js (Fonctions globales de support)

// --- 1. Top Bar Feedback ---
window.showTopbar = window.showTopbar || function(message, color) {
    console.log(`[TOPBAR] ${message}`);
    const topBar = document.getElementById("topBar");
    if (topBar) {
        topBar.textContent = message;
        // La couleur par défaut est définie dans style.css, mais on peut la surcharger
        if (color) {
            topBar.style.backgroundColor = color;
        } else {
            topBar.style.backgroundColor = '#2980b9'; // Couleur par défaut
        }
    }
};

// --- 2. Mise à jour de l'ID Peer ---
window.updatePeerIdDisplay = (id) => {
    const el = document.getElementById('my-peer-id');
    if (el) {
        el.textContent = `ID Peer: ${id.substring(0, 10)}...`;
    }
    window.myPeerId = id;
    document.getElementById('btnReport').setAttribute('data-session-id', window.currentSessionId || `Manual_${Date.now()}`);
};

// --- 3. Gestion de l'Historique des Pairs (pour le signalement) ---
const MAX_HISTORY = 5;
window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {};

window.updateLastPeers = (newPeerId) => {
    if (!newPeerId || newPeerId === window.myPeerId) return;
    window.lastPeers[newPeerId] = Date.now();
    let peerArray = Object.entries(window.lastPeers);
    peerArray.sort((a, b) => b[1] - a[1]);
    if (peerArray.length > MAX_HISTORY) {
        peerArray = peerArray.slice(0, MAX_HISTORY);
    }
    window.lastPeers = Object.fromEntries(peerArray);
    localStorage.setItem('lastPeers', JSON.stringify(window.lastPeers));
    
    // Si la fenêtre de signalement est ouverte, la rafraîchir
    const reportTarget = document.getElementById('reportTarget');
    if (reportTarget && reportTarget.classList.contains('visible') && typeof window.buildPeerOptions === 'function') {
        window.buildPeerOptions();
    }
};
