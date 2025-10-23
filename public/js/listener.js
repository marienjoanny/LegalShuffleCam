// LegalShuffleCam • listener.js réécrit (client-only)

window.connectSocketAndWebRTC = function (stream) {
  const socket = io();
  let peerConnection = null;
  let partnerId = null;

  socket.on("partner", ({ id }) => {
    partnerId = id;
    peerConnection = new RTCPeerConnection();

    stream.getTracks().forEach(track => {
      peerConnection.addTrack(track, stream);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
      }
    };

    peerConnection.createOffer().then(offer => {
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      socket.emit("offer", { to: partnerId, sdp: peerConnection.localDescription });
    });

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById("remoteVideo");
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
        console.log("[RTC] remoteVideo.srcObject assigné");
      }
    };
  });

  socket.on("offer", ({ from, sdp }) => {
    partnerId = from;
    peerConnection = new RTCPeerConnection();

    peerConnection.ontrack = (event) => {
      const remoteVideo = document.getElementById("remoteVideo");
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
        console.log("[RTC] remoteVideo.srcObject assigné (callee)");
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
      }
    };

    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
      return peerConnection.createAnswer();
    }).then(answer => {
      return peerConnection.setLocalDescription(answer);
    }).then(() => {
      socket.emit("answer", { to: partnerId, sdp: peerConnection.localDescription });
    });
  });

  socket.on("answer", ({ sdp }) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(sdp));
  });

  socket.on("ice-candidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });

  if (peerConnection) {
    peerConnection.onconnectionstatechange = () => {
      console.log("[RTC] 🔄 État peerConnection :", peerConnection.connectionState);
    };
  }
};
