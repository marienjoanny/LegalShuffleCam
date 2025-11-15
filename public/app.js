// Solution ULTIME pour les caméras mobiles
// À intégrer dans ton app.js existant

// 1. Fonction d'affichage optimisée pour mobile
function showMessage(msg, isError = false) {
  const topBar = document.getElementById('topBar');
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "📱 ") + msg;
    console.log((isError ? "[ERREUR] " : "[INFO] ") + msg);
  }
}

// 2. Détection des caméras pour mobile (version qui MARCHE)
async function detectMobileCameras() {
  showMessage("Détection des caméras mobiles...");

  try {
    // Solution 1: Demande d'accès basique pour "réveiller" les caméras
    const testStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    testStream.getTracks().forEach(track => track.stop());
    showMessage("Accès caméra mobile autorisé ✅");

    // Solution 2: Liste complète des périphériques
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');

    const cameraSelect = document.getElementById('cameraSelect');
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, i) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label ||
                           (camera.label.includes('back') ? 'Caméra arrière' :
                            camera.label.includes('front') ? 'Caméra avant' :
                            `Caméra ${i+1}`);
        cameraSelect.appendChild(option);
      });
    }

    showMessage(`✅ ${cameras.length} caméra(s) mobile(s) détectée(s)`);

    // Démarrer avec la caméra arrière par défaut
    const backCamera = cameras.find(c => c.label.includes('back')) ||
                      cameras.find(c => c.label.includes('environment')) ||
                      cameras[0];
    if (backCamera) startMobileCamera(backCamera.deviceId);

  } catch (error) {
    showMessage(`Erreur mobile: ${error.name || 'Erreur'}: ${error.message}`, true);

    // Solution de secours pour iOS
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      try {
        const iosStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
          audio: false
        });
        iosStream.getTracks().forEach(track => track.stop());
        showMessage("Caméra iOS détectée en mode secours ✅");
        detectMobileCameras(); // Réessayer
      } catch (iosError) {
        showMessage(`Erreur iOS: ${iosError.message}`, true);
      }
    }
  }
}

// 3. Démarrage d'une caméra mobile
async function startMobileCamera(deviceId) {
  try {
    const localVideo = document.getElementById('localVideo');
    if (!localVideo) {
      showMessage("Élément vidéo introuvable", true);
      return;
    }

    // Contraintes optimisées pour mobile
    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: deviceId.includes('back') || deviceId.includes('environment') ? 'environment' : 'user'
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = stream;
    showMessage("Caméra mobile active ✅");

    // Initialisation PeerJS ici si besoin
    // initPeerJS(stream);

  } catch (error) {
    showMessage(`Erreur caméra mobile: ${error.message}`, true);

    // Solution ultime pour Android
    if (/Android/i.test(navigator.userAgent)) {
      try {
        const androidStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        localVideo.srcObject = androidStream;
        showMessage("Caméra Android active (mode secours) ✅");
      } catch (androidError) {
        showMessage(`Erreur Android: ${androidError.message}`, true);
      }
    }
  }
}

// 4. Initialisation spécial mobile
window.addEventListener('load', () => {
  showMessage("Initialisation mobile...");

  // Détection des caméras
  detectMobileCameras();

  // Gestion du changement de caméra
  const cameraSelect = document.getElementById('cameraSelect');
  if (cameraSelect) {
    cameraSelect.addEventListener('change', (e) => {
      startMobileCamera(e.target.value);
    });
  }

  // Adaptation pour les touches tactiles
  document.addEventListener('touchstart', () => {}, {passive: true});
});