// LegalShuffleCam • face-visible.js (Module ES)
// Détection faciale avec tracking.js et gestion des événements personnalisés.

// Variable pour maintenir la référence au tracker en cours
let currentTracker = null;
let lastDetectionTimer = null;
let lastDetectionTime = 0;
let videoElement = null;

// Rendre la variable globale pour que l'UI puisse y réagir si nécessaire
window.faceVisible = false;

// --- DÉFINITION DES COULEURS DES CADRES ---
const FRAME_COLOR_VISIBLE = "#10b981"; // Vert (visage détecté)
const FRAME_COLOR_HIDDEN = "#ef4444";  // Rouge (visage perdu/flou)
const FRAME_COLOR_CONSENTED = "#3498db"; // Bleu (Neutre après consentement)


/**
 * Fonction utilitaire pour envoyer un log à la barre d'état.
 */
function showTopbarLog(message, color = '#2980b9') {
    // S'assurer que la fonction globale showTopbar existe (définie dans index-real.php)
    if (typeof showTopbar === 'function') {
        showTopbar(`[FACE] ${message}`, color);
    } else {
        console.log(`[FACE] ${message}`);
    }
}

/**
 * Arrête la détection faciale en cours.
 */
export function stopFaceDetection() {
    if (currentTracker && videoElement) {
        currentTracker.removeAllListeners('track');
        // Tentative d'arrêt du tracking sur l'élément vidéo
        if (typeof tracking.stopTracking === 'function') {
             tracking.stopTracking(videoElement);
        } else {
            console.warn("[FACE] tracking.stopTracking() non disponible. Le tracker pourrait rester actif.");
        }
        
        currentTracker = null;
        videoElement = null;
        window.faceVisible = false;
        
        if (lastDetectionTimer) {
            clearTimeout(lastDetectionTimer);
            lastDetectionTimer = null;
        }

        // Mettre à jour l'UI pour indiquer l'arrêt (le visage n'est plus "activement" visible)
        window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
            detail: { isVisible: false }
        }));

        // La TopBar affiche l'état "neutre" après l'arrêt par consentement
        showTopbarLog("Détection faciale arrêtée par consentement.", FRAME_COLOR_CONSENTED);
    }
}


/**
 * Démarre la détection faciale sur un flux vidéo.
 * @param {HTMLVideoElement} video - Élément vidéo source pour la détection.
 * @param {Object} [options] - Options de configuration.
 */
export function initFaceDetection(video, options = {}) {
    if (!window.tracking || !video) {
        showTopbarLog("tracking.js non chargé ou vidéo invalide. Détection impossible.", "#c0392b");
        window.faceVisible = false;
        return;
    }
    
    // Si un tracker est déjà actif, l'arrêter d'abord
    stopFaceDetection(); 

    const {
        detectionTimeout = 1500,
        initialScale = 4,
        stepSize = 2,
        edgesDensity = 0.1
    } = options;

    const tracker = new tracking.ObjectTracker('face');
    tracker.setInitialScale(initialScale);
    tracker.setStepSize(stepSize);
    tracker.setEdgesDensity(edgesDensity);

    currentTracker = tracker;
    videoElement = video;
    
    lastDetectionTime = Date.now();
    
    // Fonction pour gérer le changement d'état de visibilité après timeout
    const checkVisibility = () => {
        const now = Date.now();
        const isVisible = (now - lastDetectionTime) < detectionTimeout;
        
        if (isVisible !== window.faceVisible) {
            window.faceVisible = isVisible;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: window.faceVisible }
            }));
        }
        
        // Relancer la vérification si le tracker est toujours actif
        if (currentTracker) {
            lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout / 2);
        }
    };
    
    tracker.on('track', (event) => {
        const detected = event.data.length > 0;
        
        if (detected) {
            lastDetectionTime = Date.now();
        }

        // Mise à jour immédiate si l'état change
        if (window.faceVisible !== detected) {
            window.faceVisible = detected;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: detected, data: event.data }
            }));
        }

        // Gestion de la timeout : si le visage n'est plus visible, on lance/continue le timer
        if (!detected && !lastDetectionTimer) {
             lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout);
        } else if (detected && lastDetectionTimer) {
             // Si détecté à nouveau, on réinitialise le timer de la timeout
             clearTimeout(lastDetectionTimer);
             lastDetectionTimer = null;
        }
    });

    tracker.on('error', (error) => {
        console.error("[FACE] Erreur de détection faciale :", error);
        stopFaceDetection();
        showTopbarLog("Erreur de détection faciale critique.", "#c0392b");
    });
    
    // Démarre le tracking sur l'élément vidéo
    tracking.track(video, tracker);
    showTopbarLog("Détection faciale démarrée.");
}


// --- GESTION DES ÉVÉNEMENTS GLOBALES (pour l'UI) ---

document.addEventListener('DOMContentLoaded', () => {
    // Événement pour mettre à jour le style du conteneur vidéo local et la topbar
    window.addEventListener('faceVisibilityChanged', (event) => {
        const localVideoContainer = document.getElementById('localVideoContainer');
        const isVisible = event.detail.isVisible;
        
        // La bannière est rouge pour "visible" et verte pour "masqué" dans votre logique de base.
        const BANNER_COLOR_VISIBLE = '#ef4444'; // Votre logique utilise 'red'
        const BANNER_COLOR_HIDDEN = '#2ecc71';  // Votre logique utilise '#2ecc71'
        
        // Vérifier si le consentement mutuel est donné
        const isConsented = window.mutualConsentGiven;
            
        if (localVideoContainer) {
             // CORRECTION CRITIQUE : Utilisation de style.setProperty pour forcer la priorité
             // Ceci résout le problème du cadre bleu qui écrasait les autres styles.
             let frameColor = FRAME_COLOR_HIDDEN; // Par défaut : Rouge
             
             if (isConsented) {
                 // Si consentement donné, cadre neutre bleu
                 frameColor = FRAME_COLOR_CONSENTED;
             } else if (isVisible) {
                 // Si visage visible (et pas de consentement), cadre vert
                 frameColor = FRAME_COLOR_VISIBLE;
             }
             
             // Utilisation de !important pour forcer le style à prendre le dessus sur le CSS externe
             localVideoContainer.style.setProperty('border', `3px solid ${frameColor}`, 'important');
             localVideoContainer.style.transition = "border 0.3s ease";
        }
        
        // Mise à jour de la bannière d'avertissement rouge
        const warningIpSpan = document.querySelector('.warning-ip span');
        if (warningIpSpan) {
            
            if (isConsented) {
                // Si consentement mutuel donné, afficher l'état "OK" permanent
                warningIpSpan.innerHTML = '🟢 CONDUITE SANS SURVEILLANCE. Consentement mutuel actif.';
                warningIpSpan.style.color = FRAME_COLOR_CONSENTED; // Couleur neutre/bleue
            } else {
                // Logique de détection active
                warningIpSpan.innerHTML = isVisible
                    ? '⚠️ VISAGE VISIBLE ! Votre IP est loguée ! Navigation Privée OBLIGATOIRE ! L\'enregistrement est illégal !!'
                    : '✅ Visage masqué/perdu. Votre IP est loguée. (L\'enregistrement est illégal !)';
                // Utilisation des couleurs d'origine pour la bannière
                warningIpSpan.style.color = isVisible ? BANNER_COLOR_VISIBLE : BANNER_COLOR_HIDDEN;
            }
        }
        
        // Mise à jour de la TopBar
        // On n'affiche les logs de détection que si le consentement n'est PAS donné
        if (!isConsented) {
            showTopbarLog(`Visage ${isVisible ? 'détecté (Cadre vert)' : 'perdu (Cadre rouge)'}.`, isVisible ? FRAME_COLOR_VISIBLE : FRAME_COLOR_HIDDEN);
        }
    });
});