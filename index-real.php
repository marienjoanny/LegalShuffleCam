<?php
// ==========================================
// LegalShuffleCam — Espace principal (cam)
// ==========================================

$logFile = __DIR__ . '/logs/real-access.log';
if (!is_dir(dirname($logFile))) {
    @mkdir(dirname($logFile), 0775, true);
}

// --- Vérification du cookie d’âge ---
if (!isset($_COOKIE['age_verified']) || $_COOKIE['age_verified'] !== '1') {
    file_put_contents($logFile, date('c') . " DENIED from " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') .
        " cookie=" . ($_COOKIE['age_verified'] ?? 'none') . "\n", FILE_APPEND);
    header('Location: /');
    exit;
}

// Log d’accès autorisé
file_put_contents($logFile, date('c') . " ALLOWED " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n", FILE_APPEND);
?>
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>LegalShuffleCam • Session</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      background: #0b1220;
      color: #e6e8ee;
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
    }
    .top-bar {
      padding: 12px;
      background: #111827;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
      border-bottom: 1px solid #1f2937;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .loader-ring {
      width: 20px;
      height: 20px;
      border: 3px solid #2563eb;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .main {
      flex: 1;
      display: grid;
      grid-template-rows: 1fr auto auto;
      padding: 16px;
      gap: 16px;
    }
    .video-zone {
      position: relative;
      background: #000;
      border-radius: 14px;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #remoteVideo {
      width: 100%;
      max-width: 560px;
      height: auto;
      background: #000;
    }
    #localVideo {
      position: absolute;
      bottom: 16px;
      right: 16px;
      width: 100px;
      height: 75px;
      border-radius: 10px;
      background: #000;
      box-shadow: 0 0 8px #000a;
    }
    .hint {
      text-align: center;
      font-size: 14px;
      color: #10b981;
      font-weight: 500;
    }
    .warning {
      text-align: center;
      font-size: 13px;
      color: #ef4444;
      font-weight: 500;
    }
    .actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    button, select {
      padding: 12px 16px;
      border-radius: 12px;
      border: none;
      font-weight: 700;
      font-size: 16px;
      cursor: pointer;
      color: #fff;
    }
    button.red { background: #dc2626; }
    button.green { background: #10b981; }
    button.blue { background: #2563eb; }
    select.yellow {
      background: #fbbf24;
      color: #111827;
    }
    button:disabled, select:disabled {
      opacity: .45;
      filter: saturate(.6);
      cursor: not-allowed;
    }
  </style>
<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/tracking-min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/data/face-min.js"></script>
</head>
<body>
  <div class="top-bar">
    <div class="loader-ring" id="loaderRing"></div>
    <span id="topBar">Chargement de la détection de visage...</span>
  </div>

  <div class="main">
    <div class="video-zone" id="faceFrame">
      <video id="remoteVideo" autoplay muted playsinline></video>
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="hint">🔒 Visage visible et navigation privée requis.</div>
    <div class="warning">⚠ Votre IP est visible et loguée. Soyez respectueux !</div>

    <div class="actions">
      <button id="btnReport" class="red">Signaler</button>
      <select id="cameraSelect" class="yellow"></select>
      <button id="btnMic" class="green">🔊</button>
      <button id="btnNext" class="blue">➡️ Interlocuteur suivant</button>
    </div>
  </div>

<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
  <script src="/app.js" defer></script>

  <script>
    const topBar = document.getElementById('topBar');
    let currentStream = null;
    window.faceVisible = false;

    window.checkUIUpdate = function() {
      if (topBar) {
        if (window.faceVisible) {
          topBar.textContent = "✅ Visage OK. Prêt à chercher un partenaire.";
        } else {
          topBar.textContent = "👤 Détection faciale requise...";
        }
      }
    };

    async function listCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        const select = document.getElementById('cameraSelect');
        select.innerHTML = '';
        videoInputs.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.textContent = 'Cam ' + (index + 1);
          select.appendChild(option);
        });
        if (videoInputs.length > 0) startCamera(videoInputs[0].deviceId);
      } catch (err) {
        console.error("Erreur détection caméra:", err.message);
        if (topBar) topBar.textContent = "❌ Caméra non trouvée.";
      }
    }

    async function startCamera(deviceId) {
      try {
        if (currentStream) currentStream.getTracks().forEach(track => track.stop());
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
        currentStream = stream;
        document.getElementById('localVideo').srcObject = stream;
      } catch (err) {
        console.error("Caméra indisponible:", err.message);
        if (topBar) topBar.textContent = "❌ Caméra refusée ou indisponible.";
      }
    }

    document.getElementById('cameraSelect').addEventListener('change', e => startCamera(e.target.value));
    listCameras();

window.okStreak = 0;
const history = Array(30).fill(0);
const localVideo = document.getElementById("localVideo");

const tracker = new tracking.ObjectTracker("face");
tracker.setInitialScale(2);
tracker.setStepSize(1.5);
tracker.setEdgesDensity(0.05);

tracking.track("#localVideo", tracker);

tracker.on("track", event => {
  const face = event.data[0];
  const visible = !!face;
  window.okStreak = visible ? Math.min(window.okStreak + 1, 30) : Math.max(window.okStreak - 1, 0);
  history.shift(); history.push(window.okStreak >= 15 ? 1 : 0);
  const sum = history.reduce((a, b) => a + b, 0);
  window.faceVisible = sum >= 15;
  window.checkUIUpdate();
  console.log("[RTC] 🔍 Visage détecté:", visible, "| Streak:", window.okStreak, "| faceVisible:", window.faceVisible);
});


    const remoteVideo = document.getElementById('remoteVideo');
    const btnSpeaker = document.getElementById('btnMic');
    if (btnSpeaker && remoteVideo) {
      btnSpeaker.addEventListener('click', () => {
        remoteVideo.muted = !remoteVideo.muted;
        btnSpeaker.textContent = remoteVideo.muted ? '🔇' : '🔊';
      });
    }

    const btnNext = document.getElementById('btnNext');
    if (btnNext) {
      setInterval(() => {
        const visible = window.faceVisible === true;
        btnNext.disabled = !visible;
        btnNext.textContent = visible ? '➡️ Interlocuteur suivant' : '🚫 Visage requis';
      }, 500);
    }
<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
  </script>

  <footer style="text-align:center; font-size:0.9em; margin-top:2em; opacity:0.6">
    <a href="/cgu.html">CGU</a> · <a href="/mentions-legales.html">Mentions légales</a>
  </footer>
<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
<script src="/socket.io/socket.io.js"></script>
<script>

window.okStreak = 0;

setInterval(async () => {

  const video = document.getElementById("localVideo");

  if (!video || video.readyState < 2) return;

  if (!window.__fgBlazeModel) return;

  try {

    const faces = await window.__fgBlazeModel.estimateFaces(video, false);

    const visible = faces.length > 0;

    window.faceVisible = visible;

    window.okStreak = visible ? window.okStreak + 1 : 0;

    window.checkUIUpdate();

    console.log("[RTC] FaceCheck:", visible, "| Streak:", window.okStreak);

  } catch (err) {

    console.error("[RTC] Erreur estimateFaces:", err);

  }

}, 500);

</script>
<script src="/listener.js"></script>

<script>

const tracker = new tracking.ObjectTracker("face");

tracker.setInitialScale(2);

tracker.setStepSize(1.5);

tracker.setEdgesDensity(0.05);

tracking.track("#webcam", tracker, { camera: true });

const history = Array(30).fill(0);

tracker.on("track", event => {

  const detected = event.data.length > 0 ? 1 : 0;

  history.shift(); history.push(detected);

  const sum = history.reduce((a,b)=>a+b,0);

  document.getElementById("status").textContent = sum >= 15 ? "✅ Détecte" : "❌ Détecte pas";

});

</script>
<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/tracking-min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/data/face-min.js"></script>

<script>

(function () {

  const video = document.getElementById("localVideo");

  const frameEl = document.getElementById("faceFrame") || video?.parentElement;

  const history = Array(30).fill(0);

  let okStreak = 0;



  function setFrameOK(ok) {

    if (!frameEl) return;

    frameEl.style.boxShadow = ok

      ? "0 0 0 6px #20c997 inset, 0 0 0 12px #0f5132 inset"

      : "0 0 0 6px #ff6b6b inset, 0 0 0 12px #842029 inset";

    frameEl.style.borderRadius = "16px";

  }



  function isCentered(face, vw, vh) {

    if (!face) return false;

    const cx = face.x + face.width / 2;

    const cy = face.y + face.height / 2;

    const area = (face.width * face.height) / (vw * vh);

    const centerTolX = vw * 0.20;

    const centerTolY = vh * 0.22;

    const minArea = 0.10;

    const okCenter = Math.abs(cx - vw / 2) <= centerTolX && Math.abs(cy - vh / 2) <= centerTolY;

    const okArea = area >= minArea;

    return okCenter && okArea;

  }



  function loop() {

    const vw = video.videoWidth || 640;

    const vh = video.videoHeight || 480;

    const tracker = new tracking.ObjectTracker("face");

    tracker.setInitialScale(2);

    tracker.setStepSize(1.5);

    tracker.setEdgesDensity(0.05);

    tracking.track("#localVideo", tracker, { camera: true });



    tracker.on("track", event => {

      const face = event.data[0];

      const ok = face && isCentered(face, vw, vh);

      okStreak = ok ? Math.min(okStreak + 1, 30) : Math.max(okStreak - 1, 0);

      history.shift(); history.push(okStreak >= 15 ? 1 : 0);

      const sum = history.reduce((a, b) => a + b, 0);

      const visible = sum >= 15;

      window.faceVisible = visible;

      setFrameOK(visible);

      if (typeof window.checkUIUpdate === "function") window.checkUIUpdate();

    });

  }



  window.addEventListener("pageshow", () => loop());

})();

</script>
<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/tracking-min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/tracking@1.1.3/build/data/face-min.js"></script>

<script>

(function () {

  const video = document.getElementById("localVideo");

  const frameEl = document.getElementById("faceFrame") || video?.parentElement;

  const history = Array(30).fill(0);

  let okStreak = 0;



  function setFrameOK(ok) {

    if (!frameEl) return;

    frameEl.style.boxShadow = ok

      ? "0 0 0 6px #20c997 inset, 0 0 0 12px #0f5132 inset"

      : "0 0 0 6px #ff6b6b inset, 0 0 0 12px #842029 inset";

    frameEl.style.borderRadius = "16px";

  }



  function isCentered(face, vw, vh) {

    if (!face) return false;

    const cx = face.x + face.width / 2;

    const cy = face.y + face.height / 2;

    const area = (face.width * face.height) / (vw * vh);

    const centerTolX = vw * 0.20;

    const centerTolY = vh * 0.22;

    const minArea = 0.10;

    const okCenter = Math.abs(cx - vw / 2) <= centerTolX && Math.abs(cy - vh / 2) <= centerTolY;

    const okArea = area >= minArea;

    return okCenter && okArea;

  }



  function loop() {

    const vw = video.videoWidth || 640;

    const vh = video.videoHeight || 480;

    const tracker = new tracking.ObjectTracker("face");

    tracker.setInitialScale(2);

    tracker.setStepSize(1.5);

    tracker.setEdgesDensity(0.05);

    tracking.track("#localVideo", tracker, { camera: true });



    tracker.on("track", event => {

      const face = event.data[0];

      const ok = face && isCentered(face, vw, vh);

      okStreak = ok ? Math.min(okStreak + 1, 30) : Math.max(okStreak - 1, 0);

      history.shift(); history.push(okStreak >= 15 ? 1 : 0);

      const sum = history.reduce((a, b) => a + b, 0);

      const visible = sum >= 15;

      window.faceVisible = visible;

      setFrameOK(visible);

      if (typeof window.checkUIUpdate === "function") window.checkUIUpdate();

    });

  }



  window.addEventListener("pageshow", () => loop());

})();

</script>
</body>
</html>
