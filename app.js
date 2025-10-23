// LegalShuffleCam • app.js (version propre et stable)
// Gère la caméra, l’audio et la logique de Next en lien avec face-visible.js

let currentStream = null;

// Récupération des éléments DOM
const topBar = document.getElementById('topBar');
const remoteVideo = document.getElementById('remoteVideo');
const localVideo = document.getElementById('localVideo');
const btnSpeaker = document.getElementById('btnMic');
const btnNext = document.getElementById('btnNext');
const cameraSelect = document.getElementById('cameraSelect');

// Indicateur global pour la détection de visage
window.faceVisible = false;

// 🔁 Met à jour la barre du haut et la bordure selon l’état de la détection
window.checkUIUpdate = function() {
  const faceFrame = document.getElementById("faceFrame");
  if (faceFrame) {
    faceFrame.style.border = window.faceVisible
      ? "3px solid #10b981"
      : "3px solid #dc2626";
  }

  if (topBar) {
    topBar.textContent = window.faceVisible
      ? "✅ Visage OK. Prêt à chercher un partenaire."
      : "👤 Détection faciale requise...";
  }
};

// 🎥 Liste les caméras disponibles et démarre la première
async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInputs = devices.filter(d => d.kind === 'videoinput');

    cameraSelect.innerHTML = '';
    videoInputs.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = `Cam ${index + 1}`;
      cameraSelect.appendChild(option);
    });

    if (videoInputs.length > 0) {
      await startCamera(videoInputs[0].deviceId);
    } else {
      if (topBar) topBar.textContent = "❌ Aucune caméra détectée.";
    }
  } catch (err) {
    console.error("[RTC] Erreur détection caméra:", err);
    if (topBar) topBar.textContent = "❌ Caméra non trouvée.";
  }
}

// ▶️ Démarre le flux caméra + micro
async function startCamera(deviceId) {
  try {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    });

    currentStream = stream;
    localVideo.srcObject = stream;

    if (typeof window.initFaceVisible === "function") {
      console.log("[RTC] Initialisation de la détection faciale...");
      window.initFaceVisible(localVideo);
    }

    if (typeof window.connectSocketAndWebRTC === "function") {
      console.log("[RTC] Connexion socket/WebRTC...");
      window.connectSocketAndWebRTC(stream);
    }

    if (topBar) topBar.textContent = "✅ Caméra active, détection en cours...";
  } catch (err) {
    console.error("[RTC] Erreur caméra:", err);
    if (topBar) topBar.textContent = "❌ Caméra refusée ou indisponible.";
  }
}

// 🎚 Changement de caméra
if (cameraSelect) {
  cameraSelect.addEventListener('change', e => {
    startCamera(e.target.value);
  });
}

// 🔈 Gestion du son distant
if (btnSpeaker && remoteVideo) {
  btnSpeaker.addEventListener('click', () => {
    remoteVideo.muted = !remoteVideo.muted;
    btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
  });
}

// ⏭ Gestion du bouton "Suivant" (bloqué sans visage)
if (btnNext) {
  setInterval(() => {
    const visible = window.faceVisible === true;
    btnNext.disabled = !visible;
    btnNext.textContent = visible ? '➡️ Interlocuteur suivant' : '🚫 Visage requis';

    if (visible && !btnNext.onclick) {
      btnNext.onclick = () => {
        console.log("[RTC] Bouton Next déclenché.");
        if (typeof disconnectWebRTC === 'function') disconnectWebRTC();
        remoteVideo.srcObject = null;
        btnNext.disabled = true;
        setTimeout(() => {
          if (typeof socket !== 'undefined') socket.emit("ready-for-match");
        }, 1500);
      };
    } else if (!visible) {
      btnNext.onclick = null;
    }
  }, 500);
}

// 🔍 Audit console pour debug initial
setTimeout(() => {
  console.log("[AUDIT] localVideo:", localVideo?.srcObject);
  console.log("[AUDIT] readyState:", localVideo?.readyState);
  console.log("[AUDIT] faceVisible:", window.faceVisible);
  console.log("[AUDIT] trackerInitialized:", window.trackerInitialized);
  if (topBar) console.log("[AUDIT] topBar:", topBar.textContent);
}, 3000);

// 🚀 Démarrage initial
listCameras();
