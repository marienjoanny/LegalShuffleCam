async function checkCameraParams() {
  const topBar = document.getElementById("topBar");
  try {
    topBar.textContent = "📷 Vérification des caméras...";
    const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
    tempStream.getTracks().forEach(t => t.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(d => d.kind === "videoinput");

    if (cameras.length === 0) {
      topBar.textContent = "❌ Aucune caméra détectée";
      return;
    }

    topBar.textContent = `📷 ${cameras.length} caméra(s) détectée(s)`;
    console.log("📋 Liste des caméras:", cameras);

    for (const cam of cameras) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: cam.deviceId } },
          audio: false
        });
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        console.log(`✅ ${cam.label || "Caméra"} → ${settings.width}x${settings.height}`);
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        console.error(`❌ ${cam.label || "Caméra"} → Erreur:`, err.message);
      }
    }

    topBar.textContent = "📷 Vérification terminée — voir console";

  } catch (err) {
    topBar.textContent = `❌ Erreur globale: ${err.message}`;
    console.error("Erreur caméra:", err);
  }
}
// checkCameraParams();
