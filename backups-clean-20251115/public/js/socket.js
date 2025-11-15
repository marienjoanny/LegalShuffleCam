// LegalShuffleCam • socket.js
// 🔌 Initialisation de la connexion Socket.IO et exposition à l'objet global 'window'

/**
 * Initialise la connexion Socket.IO.
 * L'objet créé est stocké dans 'window.socket' pour être accessible par 
 * rtc-core.js, listener.js et app.js pour la signalisation.
 * * NOTE: Ce fichier DOIT être chargé après la bibliothèque cliente Socket.IO (io.js).
 */
(function() {
    // Tente de se connecter au même hôte/port que la page actuelle
    if (typeof io !== 'undefined') {
        window.socket = io({
            // Vous pouvez ajouter des options ici si nécessaire (ex: transport: ['websocket'])
        });
        console.log("[SOCKET] Objet Socket.IO créé et exposé à window.socket.");
    } else {
        console.error("[SOCKET] La fonction 'io' est introuvable. Avez-vous chargé socket.io.js ?");
    }
})();

// Les événements de signalisation comme 'offer', 'answer', et 'partner'
// sont gérés par le fichier 'listener.js' via window.initSocketAndListeners().