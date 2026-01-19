// camera.js - Gestion du flux et changement de caméra (Version Globale)
console.log("camera.js (Global) chargé");

window.startCamera = async function(deviceId) {
    console.log("Démarrage caméra ID:", deviceId || "default");

    try {
        // 1. On arrête l'ancien flux si il existe
        if (window.localStream) {
            if (typeof window.stopFaceDetection === 'function') window.stopFaceDetection();
            window.localStream.getTracks().forEach(track => track.stop());
        }

        const constraints = {
            audio: true,
            video: deviceId ? { deviceId: { exact: deviceId } } : true
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        window.localStream = newStream;

        const localVideo = document.getElementById("localVideo");
        if (localVideo) {
            localVideo.srcObject = newStream;
            
            // On attend que la vidéo tourne pour lancer la détection
            localVideo.onplaying = () => {
                if (typeof window.initFaceDetection === 'function') {
                    window.initFaceDetection(localVideo, { detectionTimeout: 3000 });
                }
            };
        }

        // Mise à jour PeerJS si un appel est en cours
        if (window.currentCall && window.currentCall.peerConnection) {
            const sender = window.currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
            if (sender && newStream.getVideoTracks()[0]) {
                sender.replaceTrack(newStream.getVideoTracks()[0]);
            }
        }
    } catch (err) {
        console.error("Erreur startCamera:", err);
    }
};
