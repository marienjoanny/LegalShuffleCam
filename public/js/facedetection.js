const localVideo = document.getElementById('localVideo');
const topBar = document.getElementById('topBar');
const btnNext = document.getElementById('btnNextPeer');
const btnConsentement = document.getElementById('btnConsentement');
const videoObscuredMessage = document.getElementById('videoObscuredMessage');
const consentModal = document.getElementById('consentModal');
const btnConsentYes = document.getElementById('btnConsentYes');
const btnConsentNo = document.getElementById('btnConsentNo');

let lastAcceptedTime = 0;
let lastAcceptedRects = [];
const MIN_FACE_RATIO = 0.3;
const MAX_VALID_AGE = 2000;
window.mutualConsentGiven = false;

function showTopbarLog(msg, color) {
  topBar.textContent = msg;
  if(color) topBar.style.color = color;
}

function updateBorder(color) {
  localVideo.style.border = \`4px solid \${color}\`;
  localVideo.style.boxShadow = \`0 0 10px \${color}\`;
}

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
      const ratio = faceArea / videoArea;
      if(ratio >= MIN_FACE_RATIO){
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
    return;
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

navigator.mediaDevices.getUserMedia({ video:true })
  .then(stream => { localVideo.srcObject = stream; showTopbarLog("Webcam initialisée ✅","#0a0"); })
  .catch(err => { showTopbarLog("Erreur webcam ❌ " + err.message,"#a00"); });

btnConsentement.addEventListener("click", () => {
  consentModal.style.display = "flex";
});

btnConsentYes.addEventListener("click", () => {
  window.mutualConsentGiven = true;
  updateBorder("#3498db");
  showTopbarLog("Consentement activé via modal ✅", "#3498db");
  btnNext.disabled = false;
  consentModal.style.display = "none";
});

btnConsentNo.addEventListener("click", () => {
  window.mutualConsentGiven = false;
  showTopbarLog("Consentement refusé ❌", "#e67e22");
  btnNext.disabled = true;
  consentModal.style.display = "none";
});

document.addEventListener("visibilitychange", () => {
  if(document.hidden){
    videoObscuredMessage.style.display = "block";
  } else {
    videoObscuredMessage.style.display = "none";
  }
});
