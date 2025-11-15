// Version corrigée avec debug complet des périphériques

// 1. Éléments DOM
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');

// 2. Fonction d'affichage avec debug
function debugLog(message, isError = false) {
  const prefix = isError ? "[ERREUR] " : "[INFO] ";
  console.log(prefix + message);
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "🔍 ") + message;
  }
}

// 3. Fonction de détection complète avec affichage brut
async function detectAllDevices() {
  debugLog("Début de la détection des périphériques...");

  try {
    // 1. Afficher TOUS les périphériques sans filtre
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    debugLog(`Nombre total de périphériques détectés: ${allDevices.length}`);

    // Affichage brut dans la console
    console.log("=== LISTE COMPLÈTE DES PÉRIPHÉRIQUES ===");
    allDevices.forEach((device, index) => {
      console.log(`[${index}] ${device.kind}: ${device.label || 'Non nommé'} (ID: ${device.deviceId})`);
    });

    // 2. Filtrer uniquement les caméras (videoinput)
    const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
    debugLog(`Nombre de caméras (videoinput): ${videoDevices.length}`);

    // Affichage dans le sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
        debugLog(`Ajout caméra: ${device.label || `Caméra ${index + 1}`}`);
      });
    }

    // 3. Démarrer avec la première caméra si disponible
    if (videoDevices.length > 0) {
      debugLog(`Démarrage avec la première caméra: ${videoDevices[0].label || 'Caméra 1'}`);
      startCamera(videoDevices[0].deviceId);
    } else {
      debugLog("Aucune caméra videoinput détectée", true);
    }

  } catch (error) {
    debugLog(`Erreur lors de la détection: ${error.name}: ${error.message}`, true);
  }
}

// 4. Fonction de démarrage de caméra avec debug
async function startCamera(deviceId) {
  debugLog(`Démarrage de la caméra ${deviceId ? deviceId.substring(0, 8) + "..." : "par défaut"}`);

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: false
    });

    if (localVideo) {
      localVideo.srcObject = stream;
      debugLog("Caméra active ✅");

      // Afficher les détails du flux
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        debugLog(`Résolution: ${settings.width || '?'}x${settings.height || '?'},
                 FPS: ${settings.frameRate || '?'},
                 DeviceId: ${settings.deviceId || '?'}`);
      }
    }

  } catch (error) {
    debugLog(`Erreur caméra: ${error.name}: ${error.message}`, true);

    // Solution de secours
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      if (localVideo) {
        localVideo.srcObject = fallbackStream;
        debugLog("Caméra active (mode secours) ✅");
      }
    } catch (fallbackError) {
      debugLog(`Erreur mode secours: ${fallbackError.message}`, true);
    }
  }
}

// 5. Initialisation avec bouton manuel
window.addEventListener('load', () => {
  debugLog("Page chargée, initialisation...");

  // Bouton de déclenchement manuel
  const startButton = document.createElement('button');
  startButton.textContent = "Démarrer la caméra";
  startButton.style.cssText = `
    padding: 12px 20px;
    margin: 10px 0;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
  `;
  document.body.prepend(startButton);

  startButton.addEventListener('click', () => {
    debugLog("Bouton cliqué, détection des périphériques...");
    detectAllDevices();
  });

  // Gestion du changement de caméra
  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      debugLog(`Changement de caméra: ${e.target.value.substring(0, 8)}...`);
      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
      }
      startCamera(e.target.value);
    });
  });
});