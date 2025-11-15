const log = msg => {
  const logBox = document.getElementById('log');
  const line = document.createElement('div');
  line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
  logBox.appendChild(line);
};

const peer = new Peer({
  host: 'legalshufflecam.ovh',
  port: 443,
  path: '/peerjs',
  secure: true
});

let localStream;
let peerList = [];
let currentIndex = -1;

peer.on('open', id => {
  document.getElementById('peer-id').textContent = id;
  log('Ton Peer ID est : ' + id);
  fetch('/register-peer.php?id=' + id);
});

peer.on('error', err => {
  log('❌ Erreur PeerJS : ' + err.type + ' – ' + err.message);
});

peer.on('call', call => {
  if (call.peer === peer.id) return log('🚫 Appel bloqué vers soi-même');
  log('📞 Appel reçu de : ' + call.peer);
  document.getElementById('remote-id').textContent = call.peer;
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    document.getElementById('local-video').srcObject = stream;
    call.answer(stream);
    call.on('stream', remoteStream => {
      document.getElementById('remote-video').srcObject = remoteStream;
      log('✅ Connexion vidéo établie avec ' + call.peer);
    });
  }).catch(err => log('Erreur accès caméra : ' + err));
});

function startCall(remoteId) {
  if (!remoteId || remoteId === peer.id) return log('🚫 Appel bloqué vers soi-même ou ID vide');
  document.getElementById('remote-id').textContent = remoteId;
  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    localStream = stream;
    document.getElementById('local-video').srcObject = stream;
    const call = peer.call(remoteId, stream);
    call.on('stream', remoteStream => {
      document.getElementById('remote-video').srcObject = remoteStream;
      log('✅ Connexion vidéo établie avec ' + remoteId);
    });
  }).catch(err => log('Erreur accès caméra : ' + err));
}

function showInviteLink() {
  const id = document.getElementById('peer-id').textContent;
  const url = `${location.origin}?id=${id}`;
  const box = document.createElement('div');
  box.textContent = '🔗 Lien : ' + url;
  document.getElementById('log').appendChild(box);
}

function listPeers() {
  fetch('/get-peers.php')
    .then(res => res.json())
    .then(peers => {
      peerList = peers.filter(id => id !== peer.id);
      currentIndex = -1;
      updatePeerListUI(peerList);
      log('📋 Liste mise à jour (' + peerList.length + ')');
    });
}

function nextPeer() {
  if (peerList.length === 0) return log('❌ Aucun Peer disponible');
  currentIndex = (currentIndex + 1) % peerList.length;
  const nextId = peerList[currentIndex];
  log('➡️ Passage à : ' + nextId);
  startCall(nextId);
}

function updatePeerListUI(peers) {
  const list = document.getElementById('peer-list');
  list.innerHTML = '';
  peers.forEach(id => {
    const item = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = id + ' ';
    const btn = document.createElement('button');
    btn.textContent = '📞 Appeler';
    btn.onclick = () => startCall(id);
    item.appendChild(label);
    item.appendChild(btn);
    list.appendChild(item);
  });
}
