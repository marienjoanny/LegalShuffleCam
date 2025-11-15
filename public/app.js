// Version finale qui a marché hier, optimisée pour mobile

// 1. Éléments DOM minimaux
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');

// 2. Fonction d'affichage simple
function showMessage(msg, isError = false) {
  if (topBar) topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
}

// 3. Fonction qui a marché hier (version mobile)
async function setupCamera() {
  showMessage("Initialisation caméra mobile...");

  try {
    // Solution qui a fonctionné hier:
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }, // Caméra arrière par défaut
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });

    // Afficher le flux vidéo
    localVideo.srcObject = stream;
    showMessage("Caméra mobile active ✅");

    // Lister les caméras disponibles
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === 'videoinput');

    // Remplir le sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, i) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label ||
                          (i === 0 ? 'Caméra arrière' : 'Caméra avant');
        cameraSelect.appendChild(option);
      });
    }

    showMessage(`${cameras.length} caméra(s) détectée(s)`);

  } catch (error) {
    showMessage(`Erreur: ${error.message}`, true);

    // Solution de secours qui a marché hier:
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      localVideo.srcObject = fallbackStream;
      showMessage("Caméra active (mode secours) ✅");
    } catch (fallbackError) {
      showMessage(`Erreur finale: ${fallbackError.message}`, true);
    }
  }
}

// 4. Initialisation au chargement
window.addEventListener('load', () => {
  // Bouton pour déclencher manuellement (obligatoire sur mobile)
  const startButton = document.createElement('button');
  startButton.textContent = "Activer la caméra";
  startButton.style.padding = "10px 20px";
  startButton.style.margin = "10px 0";
  document.body.prepend(startButton);

  startButton.addEventListener('click', () => {
    setupCamera();

    // Gestion du changement de caméra
    if (cameraSelect) {
      cameraSelect.addEventListener('change', (e) => {
        if (localVideo.srcObject) {
          localVideo.srcObject.getTracks().forEach(track => track.stop());
        }
        setupCameraWithId(e.target.value);
      });
    }
  });
});

// Fonction pour changer de caméra
async function setupCameraWithId(deviceId) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false
    });
    localVideo.srcObject = stream;
    showMessage("Caméra changée ✅");
  } catch (error) {
    showMessage(`Erreur: ${error.message}`, true);
  }
}