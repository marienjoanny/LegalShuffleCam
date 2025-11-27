// LegalShuffleCam • face-visible.js (Module ES)
// Intégration de tracking.js pour la détection faciale locale et mise à jour de l'interface.

let tracker = null;
let lastDetectionTime = 0;
let detectionIntervalId = null;
let videoElement = null;
let options = {};
let isTrackerRunning = false; // État pour gérer les cycles de vie du tracker

// Référence au conteneur (nous appliquons la bordure au conteneur pour plus de visibilité)
const container = document.getElementById('localVideoContainer'); 

// Global pour synchroniser avec d'autres modules (match.js, app-lite.js)
window.faceVisible = false;
// window.mutualConsentGiven est supposé être géré par d'autres modules et est utilisé ici.

// ----------------------------------------------------------------------
// Fonctions de Mise à Jour de l'UI
// ----------------------------------------------------------------------

/**
 * Applique le style de bordure au conteneur vidéo local en fonction de l'état.
 * @param {boolean} isVisible - True si un visage est détecté.
 */
function updateBorder(isVisible) {
    if (!container) return;

    // 🛑 Cas 1 : Consentement mutuel ACTIF
    if (window.mutualConsentGiven) {
        // Bordure Bleue (Indique que la détection est désactivée et le flux est libre)
        container.style.border = '4px solid #3498db'; 
        container.style.boxShadow = '0 0 10px rgba(52, 152, 219, 0.8)';
        return;
    }

    // 🟢 Cas 2 : Mode anti-enregistrement ACTIF
    if (isVisible) {
        // Visage visible = OK (Vert)
        container.style.border = '4px solid #2ecc71'; 
        container.style.boxShadow = '0 0 10px rgba(46, 204, 113, 0.8)';
    } else {
        // Visage masqué = DANGER/ATTENTION (Rouge)
        container.style.border = '4px solid #e74c3c'; 
        container.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.8)';
    }
}

/**
 * Déclenche un événement global pour que d'autres modules (ex: match.js) puissent réagir.
 * @param {boolean} isVisible - État de visibilité actuel.
 * @param {boolean} isStopped - Indique si le tracking est arrêté.
 */
function dispatchVisibilityEvent(isVisible, isStopped = false) {
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
        detail: { isVisible, isStopped }
    }));
}


// ----------------------------------------------------------------------
// Logique de Détection
// ----------------------------------------------------------------------

/**
 * Fonction interne pour démarrer le tracker une fois que la vidéo est prête (écouteur 'canplay').
 */
function startTrackingInternal() {
    // Vérifier si le tracker tourne déjà
    if (isTrackerRunning || !videoElement) return;

    // 1. Initialisation du Tracker
    tracker = new window.tracking.ObjectTracker('face');
    
    // ⚙️ Paramètres ajustés pour la tolérance et la performance.
    tracker.setInitialScale(4);
    tracker.setStepSize(1.0); 
    tracker.setEdgesDensity(0.18); 
    
    // ⚙️ DÉTECTION OPTIMISÉE : Détection toutes les 10 frames (environ 3 fois par seconde)
    tracker.setSkip(10); 
    console.log("Tracking.js: Détection fixée à environ 3 fois par seconde (setSkip=10).");

    // 2. Écoute des Résultats de la Détection
    tracker.on('track', function(event) {
        // Si le consentement mutuel est actif, ignorer les détections
        if (window.mutualConsentGiven) return; 

        if (event.data.length > 0) {
            // Un visage est détecté
            lastDetectionTime = Date.now();
            if (!window.faceVisible) {
                window.faceVisible = true;
                updateBorder(true);
                dispatchVisibilityEvent(true);
            }
        }
    });

    // 3. Lancement du Tracker
    window.tracking.track(videoElement, tracker); 
    isTrackerRunning = true;

    // Initialiser lastDetectionTime pour éviter un passage au rouge immédiat au démarrage
    lastDetectionTime = Date.now();
    
    // 4. Intervalle de Vérification pour "Visage Perdu" (Le délai est de 3s)
    detectionIntervalId = setInterval(() => {
        // Si le consentement mutuel est actif, on ne vérifie pas l'absence et on garde la bordure bleue
        if (window.mutualConsentGiven) {
            updateBorder(true); // Force l'état visuel "OK/Bleu" (consentement)
            return;
        }

        const timeSinceLastDetection = Date.now() - lastDetectionTime;
        
        // Si la dernière détection remonte à plus que le délai de 3 secondes
        if (timeSinceLastDetection > options.detectionTimeout) {
            // Pas de détection récente (visage perdu)
            if (window.faceVisible) {
                window.faceVisible = false;
                updateBorder(false); // Force le Rouge
                dispatchVisibilityEvent(false);
            }
        } else {
             // Si le visage est ré-identifié avant le timeout, on confirme l'état Vert
             if (!window.faceVisible) {
                 window.faceVisible = true;
                 updateBorder(true);
                 dispatchVisibilityEvent(true);
             }
        }
    }, 200); // Vérifie toutes les 200ms

    // Force une première mise à jour (bordure rouge/verte selon l'état initial)
    updateBorder(window.faceVisible); 
    dispatchVisibilityEvent(window.faceVisible);
}

/**
 * Initialise et lance la détection faciale sur l'élément vidéo donné.
 * @param {HTMLVideoElement} video - L'élément vidéo à tracker.
 * @param {object} customOptions - Options de configuration (ex: detectionTimeout).
 */
export function initFaceDetection(video, customOptions = {}) {
    if (!container) {
         console.error("Erreur Face Detection: Le conteneur #localVideoContainer est introuvable.");
         return;
    }
    
    stopFaceDetection(); // S'assurer que tout est nettoyé avant de relancer

    videoElement = video;
    options = {
        // Le délai est maintenu à 3 secondes, pour donner au tracker le temps de se rattraper.
        detectionTimeout: 3000, 
        ...customOptions
    };

    // 🛑 ÉVÉNEMENT CRITIQUE : Démarrer le tracking seulement quand la vidéo peut être jouée
    // On utilise { once: true } pour s'assurer que l'écouteur n'est déclenché qu'une seule fois.
    videoElement.addEventListener('canplay', startTrackingInternal, { once: true });
    
    // Si la vidéo est déjà en lecture (ex: si le canplay est déjà passé), on peut forcer le démarrage
    if (videoElement.readyState >= 3) { // READY_STATE.HAVE_FUTURE_DATA
        startTrackingInternal();
    }
    
    // Afficher une bordure neutre au démarrage tant que la détection n'a pas commencé
    if (container) {
        container.style.border = '4px solid #95a5a6'; /* Gris neutre/éteint */
        container.style.boxShadow = 'none';
    }
}

/**
 * Arrête le tracker et réinitialise l'état.
 */
export function stopFaceDetection() {
    if (detectionIntervalId) {
        clearInterval(detectionIntervalId);
        detectionIntervalId = null;
    }
    
    // Important : retirer l'écoute de l'événement pour éviter les doubles lancements
    if (videoElement) {
        videoElement.removeEventListener('canplay', startTrackingInternal);
    }
    
    // On met à null les références pour le garbage collector
    tracker = null;
    isTrackerRunning = false;
    videoElement = null;

    window.faceVisible = false;
    lastDetectionTime = 0;

    // Nettoyer l'UI : Bordure bleue neutre pour indiquer que le service est éteint
    if (container) {
        container.style.border = '4px solid #95a5a6'; /* Gris neutre/éteint */
        container.style.boxShadow = 'none';
    }

    // Signaler que le tracking est arrêté
    dispatchVisibilityEvent(false, true); 
    console.log("Tracking.js: Tracker arrêté et nettoyé.");
}