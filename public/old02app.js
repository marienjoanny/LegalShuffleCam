// app.js — UI moderne + garde-fous + lecture auto remote

const ioClient = io();
let pc, localStream, peerId, micEnabled = true;

const rtcConfig = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };

// UI
const el = (id) => document.getElementById(id);
const localVideo  = el('local');
const remoteVideo = el('remote');
const btnJoin     = el('join');
const gate        = el('gate');
const btnNext     = el('next');
const btnLeave    = el('leave');
const btnMic      = el('micToggle');
const btnReport   = el('report');

// Désactive tout sauf "Démarrer" au chargement
[btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = true);

// Helpers
async function ensureLocal() {
  if (localStream) return true;
  try {
    await startLocal();
    gate.classList.add('hidden');
    [btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = false);
    return true;
  } catch (e) {
    console.warn('ensureLocal() failed:', e);
    return false;
  }
}

// --- Actions UI ---
btnJoin.onclick = async () => {
  btnJoin.disabled = true;
  if (!(await ensureLocal())) {
    alert("Permission caméra/micro refusée.");
    btnJoin.disabled = false;
    return;
  }
  ioClient.emit('queue:join');
};

btnNext.onclick  = () => ioClient.emit('next');

btnLeave.onclick = () => {
  ioClient.emit('queue:leave');
  cleanupPC();
  stopLocal();
  gate.classList.remove('hidden');
  btnJoin.disabled = false;
  [btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = true);
};

btnMic.onclick = () => {
  micEnabled = !micEnabled;
  if (localStream) localStream.getAudioTracks().forEach(t => t.enabled = micEnabled);
  btnMic.textContent = micEnabled ? '🎙️' : '🔇';
};

btnReport.onclick = () => {
  if (peerId) ioClient.emit('report', { against: peerId });
  btnReport.textContent = 'Signalé ✓';
  setTimeout(() => (btnReport.textContent = 'Signaler'), 1200);
};

// --- Signaling / RTC ---
ioClient.on('match', async ({ peerId: id }) => {
  peerId = id;
  if (!(await ensureLocal())) return;

  pc = new RTCPeerConnection(rtcConfig);
  pc.onconnectionstatechange = () => console.log('pc state:', pc.connectionState);
  pc.oniceconnectionstatechange = () => console.log('ice state:', pc.iceConnectionState);

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = (ev) => {
    remoteVideo.srcObject = ev.streams[0];
    // lecture auto fiable sur mobile
    remoteVideo.onloadedmetadata = () => {
      remoteVideo.play().catch(err => console.warn('play remote error:', err));
    };
  };
  pc.onicecandidate = (ev) => {
    if (ev.candidate) ioClient.emit('rtc:ice', { to: peerId, candidate: ev.candidate });
  };

  const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
  await pc.setLocalDescription(offer);
  ioClient.emit('rtc:offer', { to: peerId, sdp: offer });
});

ioClient.on('rtc:offer', async ({ from, sdp }) => {
  peerId = from;
  if (!(await ensureLocal())) return;

  pc = new RTCPeerConnection(rtcConfig);
  pc.onconnectionstatechange = () => console.log('pc state:', pc.connectionState);
  pc.oniceconnectionstatechange = () => console.log('ice state:', pc.iceConnectionState);

  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = (ev) => {
    remoteVideo.srcObject = ev.streams[0];
    remoteVideo.onloadedmetadata = () => {
      remoteVideo.play().catch(err => console.warn('play remote error:', err));
    };
  };
  pc.onicecandidate = (ev) => {
    if (ev.candidate) ioClient.emit('rtc:ice', { to: peerId, candidate: ev.candidate });
  };

  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  ioClient.emit('rtc:answer', { to: peerId, sdp: answer });
});

ioClient.on('rtc:answer', async ({ sdp }) => {
  await pc.setRemoteDescription(new RTCSessionDescription(sdp));
});

ioClient.on('rtc:ice', async ({ candidate }) => {
  try { await pc.addIceCandidate(candidate); } catch(e){ console.warn(e); }
});

ioClient.on('ended', () => {
  cleanupPC();
  remoteVideo.srcObject = null;
});

// --- Média local ---
async function startLocal() {
  localStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: { width: { max: 640 }, height: { max: 480 }, frameRate: { max: 30 } }
  });
  // sécurité mobile (iOS/Android)
  localVideo.setAttribute('playsinline', '');
  localVideo.setAttribute('autoplay', '');
  localVideo.muted = true;

  localVideo.classList.remove('hidden');
  localVideo.srcObject = localStream;
  // certains navigateurs exigent play() explicite même en local
  localVideo.onloadedmetadata = () => {
    localVideo.play().catch(()=>{});
  };
}

function cleanupPC() {
  if (pc) {
    try { pc.close(); } catch {}
    pc = null;
  }
}

function stopLocal() {
  if (localStream) {
    try { localStream.getTracks().forEach(t => t.stop()); } catch {}
  }
  localStream = null;
  localVideo.srcObject = null;
  localVideo.classList.add('hidden');
}