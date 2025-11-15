// LegalShuffleCam • app.js
// Version ultra-minimaliste pour diagnostiquer la détection des caméras

// Éléments DOM minimaux
const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');

// Fonction pour afficher les messages
function showMessage(message, isError = false) {
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "🔍 ") + message;
  }
}

// Fonction de diagnostic complet
async function diagnoseCameras() {
  try {
    showMessage("Diagnostic des caméras en cours...");

    // 1. Vérifier si l'API est disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      showMessage("API mediaDevices non disponible", true);
      return;
    }
    showMessage("API mediaDevices disponible ✅");

    // 2. Vérifier les permissions
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' });
      showMessage(`Permissions: ${permissionStatus.state}`);
      if (permissionStatus.state === 'denied') {
        showMessage("Accès caméra refusé - autorisez dans les paramètres", true);
        return;
      }
    } catch (permErr) {
      showMessage(`Impossible de vérifier les permissions: ${permErr.message}`, true);
    }

    // 3. Lister les périphériques
    showMessage("Liste des périphériques en cours...");
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    showMessage(`Nombre de caméras: ${videoInputs.length}`);

    // 4. Afficher les caméras dans le sélecteur
    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      if (videoInputs.length > 0) {
        videoInputs.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = device.label || `Caméra ${index + 1}`;
          cameraSelect.appendChild(option);
        });
        showMessage(`${videoInputs.length} caméra(s) détectée(s) ✅`);

        // 5. Tester l'accès à la première caméra
        testCameraAccess(videoInputs[0].deviceId);
      } else {
        showMessage("Aucune caméra détectée", true);
      }
    } else {
      showMessage("Élément cameraSelect introuvable", true);
    }
  } catch (err) {
    showMessage(`Erreur: ${err.name}: ${err.message}`, true);
  }
}

// Fonction pour tester l'accès à une caméra
async function testCameraAccess(deviceId) {
  try {
    showMessage("Test d'accès à la caméra...");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: false
    });

    showMessage("Accès caméra réussi ✅");
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    showMessage(`Échec accès caméra: ${err.name}: ${err.message}`, true);

    // Test avec des contraintes plus simples
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      showMessage("Accès caméra réussi en mode compatible ✅");
      fallbackStream.getTracks().forEach(track => track.stop());
    } catch (fallbackErr) {
      showMessage(`Échec accès caméra (mode compatible): ${fallbackErr.name}: ${fallbackErr.message}`, true);
    }
  }
}

// Initialisation au chargement
window.addEventListener('load', () => {
  showMessage("Diagnostic en cours...");
  diagnoseCameras();
});