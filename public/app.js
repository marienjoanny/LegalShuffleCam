// LegalShuffleCam • app.js
// Version corrigée avec gestion améliorée des états et vérification Socket.IO

// Éléments DOM
let currentStream = null;
const topBar = document.getElementById('topBar');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const cameraSelect = document.getElementById('cameraSelect');
const btnNext = document.getElementById('btnNext');

// Variables globales
window.faceVisible = true;
let isWebRTCInitialized = false;
let isSocketConnected = false;
let turnCredentials = null;
let socketRetryCount = 0;

// Fonction pour mettre à jour la barre supérieure
function updateTopBar(message) {
  if (topBar) topBar.textContent = message;
}

// Fonction pour mettre à jour l'état du bouton
function updateNextButtonState() {
  if (btnNext) {
    // Le bouton est activé uniquement si le flux local est disponible ET que WebRTC est initialisé
    // On désactive également si le socket n'est pas connecté
    const isReady = currentStream && isWebRTCInitialized && isSocketConnected;
    btnNext.disabled = !isReady;
    if (isReady) {
        btnNext.textContent = '➡️ Interlocuteur suivant';
    } else if (!currentStream) {
        btnNext.textContent = '... En attente de la caméra ...';
    } else if (!isSocketConnected) {
        // Nouvelle vérification pour mieux cibler le problème
        if (typeof window.socket === 'undefined' || window.socket.disconnected) {
             btnNext.textContent = '... En attente du serveur de signalisation (Déconnecté)...';
        } else {
             btnNext.textContent = '... Préparation WebRTC ...';
        }
    } else {
        btnNext.textContent = '... Préparation WebRTC ...';
    }
}
}

// Fonction pour lister les caméras disponibles
async function listCameras() {
  try {
    updateTopBar("🔍 Recherche des caméras disponibles...");

    const permissionStatus = await navigator.permissions.query({ name: 'camera' });
    console.log('Statut des permissions caméra:', permissionStatus.state);

    if (permissionStatus.state === 'denied') {
      updateTopBar("❌ Permission caméra refusée. Veuillez autoriser l'accès à la caméra.");
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    console.log('Périphériques vidéo trouvés:', videoInputs);

    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      videoInputs.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    if (videoInputs.length > 0) {
      await startCamera(videoInputs[0].deviceId);
    } else {
      updateTopBar("❌ Aucune caméra détectée.");
      console.warn('Aucune caméra détectée sur ce périphérique.');
    }
  } catch (err) {
    console.error("Erreur lors de la liste des caméras :", err);
    updateTopBar("❌ Erreur lors de la détection des caméras.");
  }
}

// Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    updateTopBar("📷 Demande d'accès à la caméra...");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      updateTopBar("❌ API mediaDevices non disponible.");
      console.error('API mediaDevices non disponible');
      return;
    }

    if (!localVideo) {
      updateTopBar("❌ Élément vidéo local introuvable.");
      console.error('Élément localVideo introuvable');
      return;
    }

    console.log('Demande d\'accès à la caméra avec deviceId:', deviceId);

    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true
    };

    console.log('Contraintes utilisées:', constraints);

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    currentStream = stream;
    localVideo.srcObject = stream;

    console.log('Flux obtenu avec succès:', stream);
    updateTopBar("✅ Caméra active. Initialisation WebRTC en cours...");

    if (stream.getVideoTracks().length > 0) {
      const track = stream.getVideoTracks()[0];
      console.log('Piste vidéo obtenue:', {
        id: track.id,
        kind: track.kind,
        label: track.label,
        readyState: track.readyState
      });
    }

    if (typeof window.initFaceVisible === "function") {
      window.initFaceVisible(localVideo);
    }

    // Tenter d'initialiser WebRTC. Cela se fera uniquement si le socket est déjà connecté.
    initWebRTC(currentStream);

    window.faceVisible = true;
    window.dispatchEvent(new CustomEvent('faceVisibilityChanged'));
    updateNextButtonState();

  } catch (err) {
    console.error("Erreur détaillée lors de l'accès à la caméra:", {
      name: err.name,
      message: err.message,
      stack: err.stack
    });

    let userMessage = "❌ Erreur caméra.";
    if (err.name === 'NotAllowedError') {
      userMessage = "❌ Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres du navigateur.";
    } else if (err.name === 'NotFoundError') {
      userMessage = "❌ Aucune caméra trouvée.";
    }
    updateTopBar(userMessage);
    currentStream = null;
    updateNextButtonState();
  }
}

/**
 * Initialisation de WebRTC. Déclenche la demande des identifiants TURN
 * et configure les fonctions RTC/Socket, mais UNIQUEMENT si le socket est connecté.
 * @param {MediaStream} stream Le flux média local.
 */
function initWebRTC(stream) {
  // L'initialisation est faite uniquement si le socket est connecté
  if (!stream || isWebRTCInitialized || !window.socket?.connected) {
      if (stream && !isWebRTCInitialized && !window.socket?.connected) {
          console.log('[WebRTC] En attente de connexion Socket.IO pour initialisation WebRTC.');
          updateTopBar("✅ Caméra active. En attente de connexion au serveur...");
      }
      return;
  }

  try {
    isSocketConnected = true;
    console.log('[WebRTC] Socket connecté. Demande des identifiants TURN...');
    updateTopBar("✅ Caméra active. Demande des identifiants TURN...");

    // Demande des identifiants TURN via le socket
    window.socket.emit('request-turn-credentials', (credentials) => {
      if (!credentials) {
        console.error('[WebRTC] Erreur : identifiants TURN non reçus.');
        updateTopBar("⚠ Erreur d'initialisation WebRTC (identifiants TURN manquant)");
        return;
      }

      turnCredentials = credentials;
      
      // Appel à rtc-core.js pour stocker le flux et la configuration
      if (typeof window.connectSocketAndWebRTC === 'function') {
        window.connectSocketAndWebRTC(stream, turnCredentials);
        isWebRTCInitialized = true;
        console.log('[WebRTC] Initialisation réussie');
        updateTopBar("✅ Caméra active. WebRTC prêt.");
        
        // Initialiser les écouteurs de signalisation Socket.IO (listener.js)
        if (typeof window.initSocketAndListeners === 'function') {
          window.initSocketAndListeners();
        } else {
            console.error('[WebRTC] window.initSocketAndListeners non défini. Chargement manquant ?');
        }

        updateNextButtonState();
      } else {
        console.error('[WebRTC] Erreur : connectSocketAndWebRTC non défini. rtc-core.js est-il chargé ?');
        updateTopBar("⚠ Erreur d'initialisation WebRTC (fonction manquante)");
      }
    });
    
  } catch (err) {
    console.error('[WebRTC] Erreur lors de l\'initialisation:', err);
    updateTopBar("⚠ Erreur d'initialisation WebRTC");
  }
}

// Fonction pour gérer le clic sur le bouton "Interlocuteur suivant"
function handleNextClick() {
  // Déconnecter et nettoyer l'ancien appel
  if (typeof window.disconnectWebRTC === 'function') {
    window.disconnectWebRTC();
  }
  if (remoteVideo) remoteVideo.srcObject = null;

  if (btnNext) {
    btnNext.disabled = true;
    btnNext.textContent = '⏳ Connexion...';
  }

  if (currentStream && isWebRTCInitialized && window.socket?.connected) {
    updateTopBar("🔍 Recherche d'un partenaire...");
    // Appel de la fonction exposée par listener.js pour envoyer 'ready-for-match'
    if (typeof window.sendReadyForMatch === 'function') {
        window.sendReadyForMatch();
    } else {
        console.error('[NextButton] window.sendReadyForMatch non défini. (listener.js manquant ?)');
        updateTopBar("❌ Erreur : Fonction de recherche partenaire manquante.");
    }
  } else {
    let errorMessage = "❌ ";
    if (!currentStream) {
      errorMessage += "Flux vidéo local manquant.";
    } else if (!isWebRTCInitialized) {
      errorMessage += "WebRTC non initialisé. Patientiez...";
    } else if (!window.socket?.connected) {
      errorMessage += "Socket non connecté.";
    }
    console.error('[NextButton] ' + errorMessage);
    updateTopBar(errorMessage);
    updateNextButtonState(); // Réinitialiser l'état du bouton après l'erreur
  }
}

// Gestion des événements DOM
if (cameraSelect) {
  cameraSelect.addEventListener('change', (e) => startCamera(e.target.value));
}

if (btnNext) {
  btnNext.onclick = handleNextClick;
}

// --- Écouteurs d'événements personnalisés (RTC et Socket) ---

window.addEventListener('rtcError', (event) => {
  console.error("[APP] Erreur RTC reçue:", event.detail.message);
  if (topBar) {
    topBar.textContent = `⚠ ${event.detail.message}`;
  }
  updateNextButtonState();
});

window.addEventListener('rtcDisconnected', (event) => {
  console.log("[APP] Déconnexion RTC reçue:", event.detail.message);
  updateNextButtonState();
});

/**
 * Configure les écouteurs de connexion/déconnexion Socket.IO.
 * Elle tente de s'assurer que window.socket est défini.
 */
function setupSocketListeners() {
    // Si nous avons retenté 5 fois sans succès, nous arrêtons.
    if (socketRetryCount > 5) {
        console.error("[APP] 🚨 Abandon de la configuration du Socket après 5 tentatives.");
        updateTopBar("❌ Erreur critique : Échec de la connexion Socket.IO au démarrage.");
        return;
    }
    
    if (typeof window.socket !== 'undefined') {
        isSocketConnected = window.socket.connected;
        console.log('[Socket] window.socket détecté. Configuration des écouteurs.');

        window.socket.on('connect', () => {
            isSocketConnected = true;
            console.log('[Socket] Connecté.');
            // Tente d'initialiser WebRTC si le flux est déjà prêt
            if (currentStream && !isWebRTCInitialized) {
                initWebRTC(currentStream);
            }
            updateTopBar("✅ Caméra active. En attente d'initialisation WebRTC.");
            updateNextButtonState();
        });

        window.socket.on('disconnect', (reason) => {
            isSocketConnected = false;
            isWebRTCInitialized = false; 
            console.log(`[Socket] Déconnecté. Raison: ${reason}`);
            updateTopBar("⚠ Déconnecté du serveur de signalisation.");
            if (typeof window.disconnectWebRTC === 'function') {
                window.disconnectWebRTC();
            }
            updateNextButtonState();
        });
        
        // Gérer le cas où le socket est déjà connecté au moment du chargement de app.js
        if (window.socket.connected) {
             isSocketConnected = true;
             console.log('[Socket] Déjà connecté à la configuration des écouteurs. Tentative WebRTC.');
             if (currentStream && !isWebRTCInitialized) {
                initWebRTC(currentStream);
            } else {
                 updateTopBar("✅ Caméra active. En attente d'initialisation WebRTC.");
            }
             updateNextButtonState();
        } else {
             console.log('[Socket] window.socket n\'est pas encore connecté. En attente...');
             updateTopBar("✅ Caméra active. En attente de connexion au serveur...");
             updateNextButtonState();
        }
        
    } else {
        socketRetryCount++;
        console.warn(`[APP] ⏳ window.socket n'est pas défini (Tentative ${socketRetryCount}). Ré-essai dans 500ms...`);
        // Réessayer plus tard, au cas où socket.js n'aurait pas encore fini de charger
        setTimeout(setupSocketListeners, 500);
    }
}


// Initialisation au chargement de la page
window.addEventListener('load', () => {
  console.log('Page chargée, démarrage de la détection des caméras...');
  listCameras();
  
  // Démarrer la surveillance de la connexion Socket.IO avec ré-essais
  setupSocketListeners();

  window.addEventListener('beforeunload', () => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }
    if (typeof window.disconnectWebRTC === 'function') {
      window.disconnectWebRTC();
    }
  });
});