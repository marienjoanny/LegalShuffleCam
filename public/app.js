// app.js — caller crée l’offer, mais on répond à toute offer entrante

const ioClient = io();
let pc, localStream, peerId, micEnabled = true, myRole = 'callee';
const rtcConfig = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };

// UI
const $ = (id) => document.getElementById(id);
const localVideo=$('local'), remoteVideo=$('remote');
const btnJoin=$('join'), gate=$('gate'), btnNext=$('next'), btnLeave=$('leave'), btnMic=$('micToggle'), btnReport=$('report');
[btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = true);

async function ensureLocal(){
  if (localStream) return true;
  try{
    localStream = await navigator.mediaDevices.getUserMedia({
      audio:true, video:{ width:{max:640}, height:{max:480}, frameRate:{max:30} }
    });
    localVideo.setAttribute('playsinline',''); localVideo.setAttribute('autoplay',''); localVideo.muted = true;
    localVideo.classList.remove('hidden'); localVideo.srcObject = localStream;
    localVideo.onloadedmetadata = () => localVideo.play().catch(()=>{});
    gate.classList.add('hidden'); [btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = false);
    return true;
  }catch(e){ console.warn('ensureLocal() failed:', e); return false; }
}

btnJoin.onclick = async () => { btnJoin.disabled = true; if(!(await ensureLocal())){ alert('Permission caméra/micro refusée.'); btnJoin.disabled=false; return; } ioClient.emit('queue:join'); };
btnNext.onclick  = () => ioClient.emit('next');
btnLeave.onclick = () => { ioClient.emit('queue:leave'); cleanupPC(); stopLocal(); myRole='callee'; gate.classList.remove('hidden'); btnJoin.disabled=false; [btnNext, btnLeave, btnMic, btnReport].forEach(b=>b.disabled=true); };
btnMic.onclick   = () => { micEnabled = !micEnabled; if(localStream) localStream.getAudioTracks().forEach(t=>t.enabled=micEnabled); btnMic.textContent = micEnabled ? '🎙️' : '🔇'; };
btnReport.onclick= () => { if (peerId) ioClient.emit('report',{against:peerId}); btnReport.textContent='Signalé ✓'; setTimeout(()=>btnReport.textContent='Signaler',1200); };

function newPC(){
  pc = new RTCPeerConnection(rtcConfig);
  pc.onconnectionstatechange = () => console.log('pc state:', pc.connectionState);
  pc.oniceconnectionstatechange = () => console.log('ice state:', pc.iceConnectionState);
  localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  pc.ontrack = (ev) => {
    console.log('ontrack stream:', ev.streams[0]);
    remoteVideo.srcObject = ev.streams[0];
    remoteVideo.muted = true;
    remoteVideo.onloadedmetadata = () => remoteVideo.play().catch(err => console.warn('play remote error:', err));
  };
  pc.onicecandidate = (ev) => { if (ev.candidate) ioClient.emit('rtc:ice', { to: peerId, candidate: ev.candidate }); };
}

ioClient.on('match', async ({ peerId: id, role }) => {
  peerId = id; myRole = role || 'callee';
  if (!(await ensureLocal())) return;
  newPC();
  if (myRole === 'caller') {
    const offer = await pc.createOffer({ offerToReceiveAudio:true, offerToReceiveVideo:true });
    await pc.setLocalDescription(offer);
    ioClient.emit('rtc:offer', { to: peerId, sdp: offer });
  } else {
    console.log('waiting offer…');
  }
});

// IMPORTANT: on répond à toute offer entrante (même si on pensait être caller)
ioClient.on('rtc:offer', async ({ from, sdp }) => {
  peerId = from;
  if (!(await ensureLocal())) return;
  if (!pc) newPC();
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

ioClient.on('ended', () => { cleanupPC(); remoteVideo.srcObject = null; myRole='callee'; });

function cleanupPC(){ if (pc){ try{pc.close();}catch{} pc=null; } }
function stopLocal(){ if(localStream){ try{ localStream.getTracks().forEach(t=>t.stop()); }catch{} } localStream=null; localVideo.srcObject=null; localVideo.classList.add('hidden'); }

// Permettre d’activer le son distant après un tap (autoplay mobile)
document.addEventListener('click', () => { if (remoteVideo && remoteVideo.srcObject) remoteVideo.muted = false; }, { once:true });