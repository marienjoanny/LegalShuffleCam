// app-lite.js
import { initPeer } from '/js/peer-init.js';
import { maybeStartCall } from '/js/call-direct.js';

initPeer().then(peerId => {
  maybeStartCall(peerId);
});
