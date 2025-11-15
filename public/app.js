// Version finale qui MARCHE pour lister les caméras
// À placer dans ton app.js existant

// 1. Fonction pour afficher les messages dans la topBar
function showMessage(msg) {
  const topBar = document.getElementById('topBar');
  if (topBar) topBar.textContent = msg;
}

// 2. Fonction pour lister les caméras (version qui MARCHE)
async function listCameras() {
  showMessage("Recherche des caméras...");

  try {
    // Méthode directe qui contourne les problèmes
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(track => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');

    const cameraSelect = document.getElementById('cameraSelect');
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    showMessage(`✅ ${cameras.length} caméra(s) détectée(s)`);

    // Démarrer avec la première caméra
    if (cameras.length > 0) {
      startCamera(cameras[0].deviceId);
    } else {
      showMessage("❌ Aucune caméra détectée");
    }

  } catch (error) {
    showMessage(`❌ Erreur: ${error.message}`);

    // Solution de secours si la première méthode échoue
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      fallbackStream.getTracks().forEach(track => track.stop());
      showMessage("Caméra détectée en mode secours ✅");
    } catch (fallbackError) {
      showMessage(`❌ Erreur finale: ${fallbackError.message}`);
    }
  }
}

// 3. Fonction pour démarrer une caméra
async function startCamera(deviceId) {
  try {
    const localVideo = document.getElementById('localVideo');
    if (!localVideo) {
      showMessage("Élément vidéo introuvable");
      return;
    }

    const constraints = {
      video: { deviceId: { exact: deviceId } },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = stream;
    showMessage("Caméra active ✅");

    // Ici tu peux ajouter l'initialisation de PeerJS
    // initPeerJS(stream);

  } catch (error) {
    showMessage(`❌ Erreur caméra: ${error.message}`);
  }
}

// 4. Initialisation au chargement
window.addEventListener('load', () => {
  listCameras();

  // Gestion du changement de caméra
  const cameraSelect = document.getElementById('cameraSelect');
  if (cameraSelect) {
    cameraSelect.addEventListener('change', (event) => {
      startCamera(event.target.value);
    });
  }
});