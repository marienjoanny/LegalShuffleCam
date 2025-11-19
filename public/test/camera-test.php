<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Test Caméra</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    #topBar { margin-bottom: 10px; font-weight: bold; }
    #cameraSelect, #cameraList { margin-top: 10px; }
    video { width: 320px; height: 240px; background: #000; margin-top: 10px; }
  </style>
</head>
<body>
  <div id="topBar">Initialisation...</div>
  <select id="cameraSelect"></select>
  <ul id="cameraList"></ul>
  <video id="localVideo" autoplay muted playsinline></video>

  <script type="module">
    import { listCameras, startCamera } from "/js/camera.js";

    window.addEventListener("DOMContentLoaded", () => {
      listCameras();

      const select = document.getElementById("cameraSelect");
      const list = document.getElementById("cameraList");

      select.addEventListener("change", () => {
        const deviceId = select.value;
        if (deviceId) startCamera(deviceId);
      });

      // Hook pour afficher les labels dans <ul>
      navigator.mediaDevices.enumerateDevices().then(devices => {
        const cameras = devices.filter(d => d.kind === "videoinput");
        list.innerHTML = "";
        cameras.forEach((cam, i) => {
          const li = document.createElement("li");
          li.textContent = cam.label || `Caméra ${i + 1}`;
          list.appendChild(li);
        });
      });
    });
  </script>
</body>
</html>
