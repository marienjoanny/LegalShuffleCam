// LegalShuffleCam • face-visible.js (Module ES)
// Détection faciale avec tracking.js et gestion des événements personnalisés.

// Variable pour maintenir la référence au tracker en cours
let currentTracker = null;
let lastDetectionTimer = null;
let lastDetectionTime = 0;
let videoElement = null;

// Rendre la variable globale pour que l'UI puisse y réagir si nécessaire
window.faceVisible = false;

// --- DÉFINITION DES COULEURS ---

// COULEURS POUR LA BORDURE DE LA CAMÉRA LOCALE (#localVideo)
const FRAME_COLOR_DETECTED = "#2ecc71";  // Vert (L'outil est ACTIF et a trouvé un visage)
const FRAME_COLOR_LOST = "#e74c3c";      // Rouge (L'outil est ACTIF mais le visage est perdu/masqué)
const FRAME_COLOR_CONSENTED = "#3498db"; // Bleu (Neutre après consentement ou détection arrêtée)

// Ajout de styles d'ombre pour accentuer la couleur de la bordure
const FRAME_SHADOW_DETECTED = `0 0 8px ${FRAME_COLOR_DETECTED}, 0 0 15px ${FRAME_COLOR_DETECTED}`; // Ombre Verte intense
const FRAME_SHADOW_LOST = `0 0 8px ${FRAME_COLOR_LOST}`;                                           // Ombre Rouge simple
const FRAME_SHADOW_NEUTRAL = "0 4px 10px rgba(0, 0, 0, 0.5)";                                       // Ombre neutre par défaut

// COULEURS POUR LE BANDEAU D'ALERTE (.warning-ip span)
const BANNER_COLOR_VIOLATION = '#ef4444'; // Rouge (Visage Visible / Violation de règle)
const BANNER_COLOR_SAFE = '#2ecc71';      // Vert (Visage masqué / Respect des règles)
const BANNER_COLOR_NEUTRAL = '#3498db';   // Bleu (Consentement / État neutre)


/**
 * Fonction utilitaire pour envoyer un log à la barre d'état (TopBar).
 */
function showTopbarLog(message, color = '#2980b9') {
    // Cible la barre fixe tout en haut
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

        // Déclenche l'événement pour mettre à jour l'UI en mode arrêté/neutre
        window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
            detail: { isVisible: false, isStopped: true }
        }));

        showTopbarLog("Détection faciale arrêtée par consentement.", FRAME_COLOR_CONSENTED);
    }
}


/**
 * Démarre la détection faciale sur un flux vidéo.
 * @param {HTMLVideoElement} video - Élément vidéo source pour la détection.
 */
export function initFaceDetection(video, options = {}) {
    if (!window.tracking || !video) {
        showTopbarLog("tracking.js non chargé ou vidéo invalide. Détection impossible.", "#c0392b");
        window.faceVisible = false;
        return;
    }
    
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
    
    const checkVisibility = () => {
        const now = Date.now();
        const isVisible = (now - lastDetectionTime) < detectionTimeout;
        
        if (isVisible !== window.faceVisible) {
            window.faceVisible = isVisible;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: window.faceVisible, isStopped: false }
            }));
        }
        
        if (currentTracker) {
            lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout / 2);
        }
    };
    
    tracker.on('track', (event) => {
        const detected = event.data.length > 0;
        
        if (detected) {
            lastDetectionTime = Date.now();
        }

        if (window.faceVisible !== detected) {
            window.faceVisible = detected;
            window.dispatchEvent(new CustomEvent('faceVisibilityChanged', {
                detail: { isVisible: detected, data: event.data, isStopped: false }
            }));
        }

        if (!detected && !lastDetectionTimer) {
             lastDetectionTimer = setTimeout(checkVisibility, detectionTimeout);
        } else if (detected && lastDetectionTimer) {
             clearTimeout(lastDetectionTimer);
             lastDetectionTimer = null;
        }
    });

    tracker.on('error', (error) => {
        console.error("[FACE] Erreur de détection faciale :", error);
        stopFaceDetection();
        showTopbarLog("Erreur de détection faciale critique.", "#c0392b");
    });
    
    tracking.track(video, tracker);
    showTopbarLog("Détection faciale démarrée.");
}


// --- GESTION DES ÉVÉNEMENTS GLOBALES (pour l'UI) ---

document.addEventListener('DOMContentLoaded', () => {
    
    window.addEventListener('faceVisibilityChanged', (event) => {
        // Cible l'élément VIDEO (#localVideo)
        const localVideoElement = document.getElementById('localVideo');
        const isVisible = event.detail.isVisible;
        const isStopped = event.detail.isStopped || false;
        const isConsented = window.mutualConsentGiven;
        
        // Cible le SPAN dans le bandeau d'information permanent (.warning-ip)
        const warningIpSpan = document.querySelector('.warning-ip span');
            
        // --- 1. GESTION DE LA BORDURE et SHADOW (#localVideo) ---
        if (localVideoElement) {
             let frameColor = FRAME_COLOR_LOST; 
             let shadowStyle = FRAME_SHADOW_LOST;
             
             if (isConsented || isStopped) {
                 // Mode Neutre
                 frameColor = FRAME_COLOR_CONSENTED;
                 shadowStyle = FRAME_SHADOW_NEUTRAL;
             } else if (isVisible) {
                 // Mode Détection OK (Vert)
                 frameColor = FRAME_COLOR_DETECTED;
                 shadowStyle = FRAME_SHADOW_DETECTED; // Ombre lumineuse pour accentuer l'état "actif/trouvé"
             }
             
             // Forcer le style de la bordure et de l'ombre avec !important
             localVideoElement.style.setProperty('border', `3px solid ${frameColor}`, 'important');
             localVideoElement.style.setProperty('box-shadow', shadowStyle, 'important');
             localVideoElement.style.transition = "border 0.3s ease, box-shadow 0.3s ease";
        }
        
        // --- 2. GESTION DU BANDEAU D'ALERTE PERMANENT (.warning-ip span) ---
        if (warningIpSpan) {
            if (isConsented) {
                // État de consentement (neutre)
                warningIpSpan.innerHTML = '🟢 CONDUITE SANS SURVEILLANCE. Consentement mutuel actif.';
                warningIpSpan.style.color = BANNER_COLOR_NEUTRAL; 
            } else {
                // État actif (règles de la plateforme)
                warningIpSpan.innerHTML = isVisible
                    ? '⚠️ VISAGE VISIBLE ! Votre IP est loguée ! Navigation Privée OBLIGATOIRE ! L\'enregistrement est illégal !!'
                    : '✅ Visage masqué/perdu. Votre IP est loguée. (L\'enregistrement est illégal !)';
                
                // Si visible (violation), couleur ROUGE pour le texte
                warningIpSpan.style.color = isVisible ? BANNER_COLOR_VIOLATION : BANNER_COLOR_SAFE;
            }
        }
        
        // --- 3. GESTION DU LOG TRANSITOIRE (TopBar) ---
        if (!isConsented && !isStopped) {
            showTopbarLog(`Détection active. Visage ${isVisible ? 'trouvé (Cadre Vert)' : 'perdu (Cadre Rouge)'}.`, isVisible ? FRAME_COLOR_DETECTED : FRAME_COLOR_LOST);
        }
    });
});