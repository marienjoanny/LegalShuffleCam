// LegalShuffleCam • app.js (Version FINALE avec logs visibles + patch JSON + Annuaire)

const topBar = document.getElementById('topBar');
const cameraSelect = document.getElementById('cameraSelect');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const btnNext = document.getElementById('btnNext');
const btnMic = document.getElementById('btnMic');
const btnReport = document.getElementById('btnReport');
const reportTarget = document.getElementById('reportTarget');
const loaderRing = document.getElementById('loaderRing');

let currentStream = null;
let peer = null;
let currentCall = null;

function showMessage(msg, isError = false) {
  if (topBar) {
    topBar.textContent = (isError ? "❌ " : "📷 ") + msg;
    if (loaderRing) loaderRing.style.display = isError ? 'none' : 'block';
  }
}

async function detectCameras() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showMessage("getUserMedia non supporté sur ce navigateur", true);
    return;
  }

  showMessage("Détection des caméras...");

  try {
    const tempStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    tempStream.getTracks().forEach(track => track.stop());
    showMessage("Permissions activées ✅");

    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach((device, index) => {
      showMessage(`[${index}] ${device.kind} — ${device.label || 'non nommé'}`);
    });

    const cameras = devices.filter(device => device.kind === 'videoinput');
    showMessage(`${cameras.length} caméra(s) détectée(s)`);

    if (cameraSelect) {
      cameraSelect.innerHTML = '';
      cameras.forEach((camera, index) => {
        const option = document.createElement('option');
        option.value = camera.deviceId;
        option.textContent = camera.label || `Caméra ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    }

    if (cameras.length > 0) {
      await startCamera(cameras[0].deviceId);
    } else {
      showMessage("Aucune caméra détectée", true);
    }

    if (loaderRing) loaderRing.style.display = 'none';
  } catch (error) {
    showMessage(`Erreur: ${error.name} — ${error.message}`, true);
  }
}

async function startCamera(deviceId) {
  try {
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    showMessage("Activation de la caméra...");

    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : true,
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream = stream;
    localVideo.srcObject = stream;
    showMessage("Caméra active ✅");

    const track = stream.getVideoTracks()[0];
    if (track && track.getSettings) {
      const s = track.getSettings();
      showMessage(`Résolution: ${s.width || '?'}x${s.height || '?'}`);
    }

    if (typeof initFaceVisible === 'function') {
      initFaceVisible(localVideo);
    }

    initPeerJS(stream);

    if (btnNext) {
      btnNext.disabled = false;
      btnNext.textContent = "➡️ Interlocuteur suivant";
    }
  } catch (error) {
    showMessage(`Erreur caméra: ${error.name} — ${error.message}`, true);
    try {
      const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      currentStream = fallbackStream;
      localVideo.srcObject = fallbackStream;
      showMessage("Caméra active (mode secours) ✅");
      initPeerJS(fallbackStream);
    } catch (fallbackError) {
      showMessage(`Erreur mode secours: ${fallbackError.name} — ${fallbackError.message}`, true);
    }
  }
}

function initPeerJS(stream) {
  if (!stream) return;

  const savedId = sessionStorage.getItem("peerId");
  peer = new Peer(savedId || undefined, {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    host: 'legalshufflecam.ovh',
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    port: 443,
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    path: '/peerjs',
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    secure: true,
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    debug: 2
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  peer.on('open', id => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    sessionStorage.setItem("peerId", id);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    window.myPeerId = id;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage(`PeerJS connecté (ID: ${id})`);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    registerPeer(id);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  peer.on('error', err => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage(`Erreur PeerJS: ${err.message}`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  peer.on('call', call => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    handleIncomingCall(call);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function registerPeer(peerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  fetch("/api/register-peer.php", {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    method: "POST",
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    headers: { "Content-Type": "application/json" },
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    body: JSON.stringify({ partnerId: peerId })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }).catch(err => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Erreur enregistrement peer", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function handleIncomingCall(call) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (!currentStream) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    call.close();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Appel rejeté: pas de flux vidéo", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.answer(currentStream);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('stream', remoteStream => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = remoteStream;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Flux distant reçu ✅");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('close', () => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Appel terminé");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('error', err => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    fetch("/api/unregister-peer.php", {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      method: "POST",
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      headers: { "Content-Type": "application/json" },
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      body: JSON.stringify({ partnerId: partnerId })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    setTimeout(retryNextPeer, 1000); // relance après 1s
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage(`Erreur appel: ${err.message}`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  currentCall = call;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function retryNextPeer() {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  showMessage("Nouvelle tentative...");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  handleNextClick();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function callPeer(partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (currentCall && currentCall.open) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("🔁 Connexion déjà en cours, fermeture...");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall.close();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (currentCall && currentCall.open) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("🔁 Connexion déjà en cours, fermeture...");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall.close();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (!currentStream) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Impossible d'appeler sans flux vidéo", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  const call = peer.call(partnerId, currentStream);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('stream', remoteStream => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = remoteStream;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Flux distant reçu ✅");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('close', () => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("Appel terminé");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  call.on('error', err => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    fetch("/api/unregister-peer.php", {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      method: "POST",
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      headers: { "Content-Type": "application/json" },
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      body: JSON.stringify({ partnerId: partnerId })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    setTimeout(retryNextPeer, 1000); // relance après 1s
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage(`Erreur appel: ${err.message}`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  currentCall = call;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function handleDirectCall(partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (!peer || !peer.id || !currentStream) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("PeerJS ou caméra non prêt", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  showMessage(`Appel direct vers ${partnerId}...`);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  callPeer(partnerId);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
window.addEventListener('load', () => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  showMessage("Initialisation...");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  detectCameras();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (cameraSelect) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    cameraSelect.addEventListener('change', (e) => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      startCamera(e.target.value);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (btnMic) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    btnMic.addEventListener('click', () => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (!currentStream) return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      const audioTrack = currentStream.getAudioTracks()[0];
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (audioTrack) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        audioTrack.enabled = !audioTrack.enabled;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        btnMic.textContent = audioTrack.enabled ? '🔊' : '🔇';
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (btnNext) btnNext.onclick = handleNextClick;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  // 🔗 Gestion du formulaire annuaire (si présent dans la page)
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  const annuaireForm = document.querySelector('form[action="/api/direct-call.php"]');
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (annuaireForm) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    annuaireForm.addEventListener('submit', async (e) => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      e.preventDefault();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      const formData = new FormData(annuaireForm);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      const partnerId = formData.get('partnerId');
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (!partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        showMessage("Aucun partenaire sélectionné", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      try {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        const res = await fetch('/api/direct-call.php', {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          method: 'POST',
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          body: formData
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        const data = await res.json();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        if (data && data.partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          handleDirectCall(data.partnerId);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        } else {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          showMessage("Réponse annuaire invalide", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      } catch (err) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        showMessage(`Erreur annuaire: ${err.message}`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
window.startCall = handleDirectCall;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  window.addEventListener('beforeunload', () => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    if (currentCall) currentCall.close();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    if (peer) peer.destroy();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
});
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
setInterval(() => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (peer && peer.id) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    fetch("/api/register-peer.php", {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      method: "POST",
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      headers: { "Content-Type": "application/json" },
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      body: JSON.stringify({ partnerId: peer.id })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}, 30000); // toutes les 30 secondes
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
// 🔗 Expose startCall au parent ET à l’iframe
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
window.startCall = handleDirectCall;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
if (window !== window.parent) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  window.parent.startCall = handleDirectCall;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function handleNextClick() {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (!peer || !peer.id || !currentStream) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("PeerJS ou caméra non prêt", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (currentCall && currentCall.open) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    showMessage("🔁 Interruption de l’appel en cours...");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall.close();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    remoteVideo.srcObject = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    currentCall = null;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  fetch("/api/get-peer")
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    .then(async res => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      const text = await res.text();
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      try {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        return JSON.parse(text);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      } catch (err) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        throw new Error("Réponse non JSON");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    .then(data => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (data.partnerId === peer.id) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        showMessage(`⚠️ Le serveur a renvoyé ton propre ID (${data.partnerId})`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (data.partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        showMessage(`🔗 Connexion à ${data.partnerId}`);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        callPeer(data.partnerId);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      } else {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        showMessage("Aucun partenaire disponible", true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        if (btnNext) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          btnNext.disabled = false;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
          btnNext.textContent = "➡️ Interlocuteur suivant";
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    })
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    .catch(err => {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      showMessage(`Erreur: ${err.message}`, true);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      if (btnNext) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        btnNext.disabled = false;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
        btnNext.textContent = "➡️ Interlocuteur suivant";
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
      }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    });
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
// 📞 Appel direct sans passer par le bouton "suivant"
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
function handleDirectCall(partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  if (!partnerId) {
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    console.warn("⛔ Aucun partnerId fourni");
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
    return;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  }
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  console.log("📞 Appel direct vers", partnerId);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  peerIdToCall = partnerId;
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
  startCall(peerIdToCall);
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
}
    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });

    peer.on("open", id => {

      window.myPeerId = id;

      sessionStorage.setItem("peerId", id);



      const urlParams = new URLSearchParams(window.location.search);

      const partnerId = urlParams.get("partnerId");

      const callerId = urlParams.get("callerId");



      if (partnerId && !callerId) {

        const newUrl = new URL(window.location.href);

        newUrl.searchParams.set("callerId", id);

        window.location.replace(newUrl.toString());

        return;

      }



      if (partnerId && callerId) {

        console.log("📞 Appel direct déclenché vers", partnerId);

        handleDirectCall(partnerId);

      }

    });
