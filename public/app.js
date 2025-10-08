// --- Variables Globales ---
const ioClient = io();
let pc, localStream, peerId, micEnabled = true, myRole = 'callee';
const rtcConfig = { iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }] };

// UI Selectors
const $ = (id) => document.getElementById(id);
const localVideo = $('local'), remoteVideo = $('remote');
const btnJoin = $('join'), gate = $('gate'), btnNext = $('next'), 
      btnLeave = $('leave'), btnMic = $('micToggle'), btnReport = $('report');
const topBar = document.querySelector('.top-bar span');
const loaderRing = document.querySelector('.loader-ring');

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
    gate.classList.add('hidden'); 
    [btnNext, btnLeave, btnMic, btnReport].forEach(b => b.disabled = false);
    return true;
  }catch(e){ console.warn('ensureLocal() failed:', e); return false; }
}

// 🎯 Mise à jour des gestionnaires de clics 🎯

btnJoin.onclick = async () => { 
    btnJoin.disabled = true; 
    if(!(await ensureLocal())){ 
        alert('Permission caméra/micro refusée.'); 
        btnJoin.disabled=false; 
        return; 
    } 
    ioClient.emit('queue:join'); 
};

// VÉRIFICATION FACIALE (Étape 1 & 3)
btnNext.onclick  = () => {
    // Si window.faceVisible n'est pas encore défini (FaceGuard pas chargé), on laisse passer.
    if (typeof window.faceVisible === 'undefined' || window.faceVisible) {
        ioClient.emit('next');
    } else {
        console.warn('Action "next" bloquée: visage non détecté.');
    }
};

btnLeave.onclick = () => { 
    ioClient.emit('queue:leave'); 
    cleanupPC(); 
    stopLocal(); 
    myRole='callee'; 
    gate.classList.remove('hidden'); 
    btnJoin.disabled=false; 
    [btnNext, btnLeave, btnMic, btnReport].forEach(b=>b.disabled=true); 
};
btnMic.onclick   = () => { micEnabled = !micEnabled; if(localStream) localStream.getAudioTracks().forEach(t=>t.enabled=micEnabled); btnMic.textContent = micEnabled ? '🎙️' : '🔇'; };
btnReport.onclick= () => { if (peerId) ioClient.emit('report',{against:peerId}); btnReport.textContent='Signalé ✓'; setTimeout(()=>btnReport.textContent='Signaler',1200); };

function newPC(){
  pc = new RTCPeerConnection(rtcConfig);
  pc.onconnectionstatechange = () => console.log('pc state:', pc.connectionState);
  pc.oniceconnectionstatechange = () => console.log('ice state:', pc.iceConnectionState);
  
  if (localStream) { 
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
  }

  pc.ontrack = (ev) => {
    console.log('ontrack stream:', ev.streams[0]);
    remoteVideo.srcObject = ev.streams[0];
    remoteVideo.muted = true;
    remoteVideo.onloadedmetadata = () => remoteVideo.play().catch(err => console.warn('play remote error:', err));
  };
  pc.onicecandidate = (ev) => { if (ev.candidate) ioClient.emit('rtc:ice', { to: peerId, candidate: ev.candidate }); };
}

// 🎯 Gestionnaires de Socket.IO mis à jour (Matchmaking/Statut) 🎯

ioClient.on('match', async ({ peerId: id, role }) => {
  peerId = id; myRole = role || 'callee';
  if (!(await ensureLocal())) return;
  newPC();
  
  // Mise à jour de l'UI: Match trouvé
  topBar.textContent = 'En conversation…';
  loaderRing.style.visibility = 'hidden';

  if (myRole === 'caller') {
    const offer = await pc.createOffer({ offerToReceiveAudio:true, offerToReceiveVideo:true });
    await pc.setLocalDescription(offer);
    ioClient.emit('rtc:offer', { to: peerId, sdp: offer });
  } else {
    console.log('waiting offer…');
  }
});

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

// Gère l'état d'attente (Étape 5 - nouveau)
ioClient.on('status:waiting', ({ queueSize }) => {
    topBar.textContent = `Recherche en cours... (en file : ${queueSize})`;
    loaderRing.style.visibility = 'visible';
    remoteVideo.srcObject = null; 
    cleanupPC(); 
});

// Gère la fin de match ou déconnexion du pair (Étape 6 - mis à jour)
ioClient.on('ended', () => { 
    cleanupPC(); 
    remoteVideo.srcObject = null; 
    myRole='callee'; 
    topBar.textContent = 'Recherche d’un partenaire…'; 
    loaderRing.style.visibility = 'visible';
});

// Gère le BLOCAGE par modération (Étape 5 - nouveau, critique)
ioClient.on('moderation:blocked', ({ reason }) => {
    console.error('Action bloquée par modération:', reason);
    alert(`Votre action a été bloquée : ${reason}. Vous êtes déconnecté.`);
    
    ioClient.emit('queue:leave'); 
    cleanupPC();
    stopLocal(); 
    myRole='callee'; 
    
    // Mise à jour de l'UI en cas de blocage
    topBar.textContent = '⛔ BLOQUÉ PAR MODÉRATION';
    loaderRing.style.visibility = 'hidden';
    [btnNext, btnLeave, btnMic, btnReport].forEach(b=>b.disabled=true);
});

ioClient.on('next_ack', () => {
    console.log('Serveur a bien reçu la demande de "Suivant"');
});

function cleanupPC(){ if (pc){ try{pc.close();}catch{} pc=null; } }
function stopLocal(){ if(localStream){ try{ localStream.getTracks().forEach(t=>t.stop()); }catch{} } localStream=null; localVideo.srcObject=null; localVideo.classList.add('hidden'); }

// Permettre d’activer le son distant après un tap (autoplay mobile)
document.addEventListener('click', () => { if (remoteVideo && remoteVideo.srcObject) remoteVideo.muted = false; }, { once:true });


// --- FaceGuard Dynamic Check (Étape 1) ---
// Active/désactive le bouton "Suivant" en fonction de la détection faciale
setInterval(() => {
    // On vérifie que la gate n'est PAS visible (donc que localStream est ON)
    if (gate.classList.contains('hidden')) {
        // Attend que FaceGuard soit initialisé
        if (typeof window.faceVisible !== 'undefined') {
            btnNext.disabled = !window.faceVisible;
        }
    }
}, 500);
