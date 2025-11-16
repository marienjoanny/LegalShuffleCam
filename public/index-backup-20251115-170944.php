<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LegalShuffleCam • Test Caméra</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    #status { margin-bottom: 20px; padding: 10px; background: #f0f0f0; }
    #cameraSelect { padding: 8px; width: 100%; max-width: 400px; }
    video { width: 100%; max-width: 400px; background: #000; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; margin: 10px 0; }
    #debug { margin-top: 20px; padding: 10px; background: #f8f8f8; white-space: pre-wrap; }
  </style>
</head>
<body>
<script src="https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js"></script>

<script>

  const peer = new Peer(undefined, {

    host: location.hostname,

    port: 443,

    path: "/peerjs",

    secure: true

  });

  peer.on("open", id => {

    document.body.innerHTML = `<h1>ID: ${id}</h1>`;

  });

  peer.on("error", err => {

    document.body.innerHTML = `<pre>${err}</pre>`;

  });

</script>
<script src="https://cdn.jsdelivr.net/npm/peerjs@1.4.7/dist/peerjs.min.js"></script>

<script>

  const peer = new Peer(undefined, {

    host: location.hostname,

    port: 443,

    path: "/peerjs",

    secure: true

  });

  peer.on("open", id => {

    const el = document.createElement("div");

    el.innerHTML = `<h2 style="color:limegreen">✅ ID généré : <code>${id}</code></h2>`;

    document.body.prepend(el);

  });

  peer.on("error", err => {

    const el = document.createElement("div");

    el.innerHTML = `<h2 style="color:red">❌ Erreur PeerJS : <pre>${err}</pre></h2>`;

    document.body.prepend(el);

  });

</script>
  <div id="status">Prêt à détecter les caméras</div>
  <button id="startButton">Démarrer la détection</button>
  <select id="cameraSelect"></select>
  <video id="localVideo" autoplay playsinline muted></video>
  <div id="debug"></div>

  <script>
    let currentStream = null;
    const statusDiv = document.getElementById('status');
    const debugDiv = document.getElementById('debug');
    const cameraSelect = document.getElementById('cameraSelect');
    const localVideo = document.getElementById('localVideo');
    const startButton = document.getElementById('startButton');

    function log(message, isError = false) {
      const prefix = isError ? "❌ " : "📷 ";
      statusDiv.textContent = prefix + message;
      debugDiv.innerHTML += `<div>${prefix}${message}</div>`;
      console.log(prefix + message);
    }

    async function detectCameras() {
      log("Activation caméra pour débloquer la détection...");

      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
        tempStream.getTracks().forEach(track => track.stop());
        log("Caméra temporaire activée ✅");

        const devices = await navigator.mediaDevices.enumerateDevices();
        debugDiv.innerHTML += `<h3>Périphériques détectés (${devices.length}):</h3>`;
        devices.forEach((device, index) => {
          debugDiv.innerHTML += `<div>[${index}] ${device.kind}: ${device.label || 'Non nommé'} (ID: ${device.deviceId.substring(0, 8)}...)</div>`;
        });

        const cameras = devices.filter(device => device.kind === 'videoinput');
        log(`Nombre de caméras (videoinput): ${cameras.length}`);

        if (cameras.length > 0) {
          cameraSelect.innerHTML = '';
          cameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.textContent = camera.label || `Caméra ${index + 1}`;
            cameraSelect.appendChild(option);
          });

          await startCamera(cameras[0].deviceId);
        } else {
          log("Aucune caméra détectée", true);
        }

      } catch (error) {
        log(`Erreur: ${error.name}: ${error.message}`, true);
      }
    }

    async function startCamera(deviceId) {
      try {
        log(`Démarrage de la caméra ${deviceId.substring(0, 8)}...`);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: deviceId } },
          audio: false
        });

        localVideo.srcObject = stream;
        log("Caméra active ✅");

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          log(`Résolution: ${settings.width || '?'}x${settings.height || '?'}`);
        }

      } catch (error) {
        log(`Erreur caméra: ${error.message}`, true);
      }
    }

    startButton.addEventListener('click', detectCameras);
  </script>
</body>
</html>
