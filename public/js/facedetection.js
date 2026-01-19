const localVideo = document.getElementById('localVideo');
const topBar = document.getElementById('topBar');
const btnNext = document.getElementById('btnNextPeer');
const btnConsentement = document.getElementById('btnConsentement');
const cameraSelect = document.getElementById('cameraSelect');
const videoObscuredMessage = document.getElementById('videoObscuredMessage');
const consentModal = document.getElementById('consentModal');
const btnConsentYes = document.getElementById('btnConsentYes');
const btnConsentNo = document.getElementById('btnConsentNo');

let lastAcceptedTime = 0;
let lastAcceptedRects = [];
const MIN_FACE_RATIO = 0.3;
const MAX_VALID_AGE = 2000;
window.mutualConsentGiven = false;
window.localStream = null;

function showTopbarLog(msg, color) {
  topBar.textContent = msg;
  if(color) topBar.style.color = color;
}

function updateBorder(color) {
  localVideo.style.border = "4px solid " + color;
  localVideo.style.boxShadow = "0 0 10px " + color;
}

// Initialisation du Tracker
const tracker = new tracking.ObjectTracker('face');
tracker.setInitialScale(4);
tracker.setStepSize(1.2);
tracker.setEdgesDensity(0.1);
tracking.track('#localVideo', tracker);

tracker.on('track', event => {
  const now = Date.now();
  const videoArea = (localVideo.videoWidth * localVideo.videoHeight) || 1;
  if(event.data.length > 0){
    event.data.forEach(rect => {
      const faceArea = rect.width * rect.height;
      if((faceArea / videoArea) >= MIN_FACE_RATIO){
        lastAcceptedRects = [rect];
        lastAcceptedTime = now;
      }
    });
  }
  const age = now - lastAcceptedTime;
  if(window.mutualConsentGiven){
    updateBorder("#3498db");
    showTopbarLog("Consentement mutuel donné ✅", "#3498db");
    btnNext.disabled = false;
    localVideo.style.filter = "none"; return;
  }
  if(lastAcceptedRects.length > 0 && age < MAX_VALID_AGE){
    updateBorder("#2ecc71"); localVideo.style.filter = "none";
    showTopbarLog("Visage détecté (≥30%) ✅", "#1abc9c");
    btnNext.disabled = false;
  } else {
    updateBorder("#e74c3c"); localVideo.style.filter = "blur(50px)";
    showTopbarLog("Rapprochez votre visage (min 30%) ❌ ");
    btnNext.disabled = true;
  }
});

// --- Gestion des caméras ---
async function setupCamera(deviceId = null) {
  if (window.localStream) {
    window.localStream.getTracks().forEach(track => track.stop());
  }
  const constraints = {
    video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "user" },
    audio: false
  };
  try {
    window.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = window.localStream;
    showTopbarLog("Caméra active ✅", "#2ecc71");
  } catch (err) {
    showTopbarLog("Erreur caméra ❌ " + err.message, "#e74c3c");
  }
}

async function listCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(d => d.kind === 'videoinput');
    cameraSelect.innerHTML = '';
    videoDevices.forEach((device, i) => {
      const opt = document.createElement('option');
      opt.value = device.deviceId;
      opt.text = device.label || `Caméra ${i + 1}`;
      cameraSelect.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

// Événements UI
cameraSelect.addEventListener('change', () => setupCamera(cameraSelect.value));
btnConsentement.addEventListener("click", () => { consentModal.style.display = "flex"; });
btnConsentYes.addEventListener("click", () => {
  window.mutualConsentGiven = true;
  updateBorder("#3498db");
  showTopbarLog("Consentement activé ✅", "#3498db");
  btnNext.disabled = false;
  consentModal.style.display = "none";
});
btnConsentNo.addEventListener("click", () => {
  window.mutualConsentGiven = false;
  showTopbarLog("Consentement refusé ❌", "#e67e22");
  btnNext.disabled = true;
  consentModal.style.display = "none";
});

// Lancement initial
listCameras().then(() => setupCamera());

document.addEventListener("visibilitychange", () => {
  if(typeof videoObscuredMessage !== "undefined" && videoObscuredMessage) videoObscuredMessage.style.display = document.hidden ? "block" : "none";
});
