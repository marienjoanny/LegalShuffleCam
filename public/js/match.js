let peer = null;
let conn = null;

export function initMatch() {
  peer = new Peer(undefined, {
    host: 'legalshufflecam.ovh',
    port: 443,
    path: '/peerjs',
    secure: true
  });

  peer.on("open", id => {
    window.myPeerId = id;
    sessionStorage.setItem("peerId", id);
    document.getElementById("topBar").textContent = `🟢 Connecté : ${id}`;
  });

  peer.on("connection", c => {
    conn = c;
    conn.on("data", data => {
      console.log("📨 Reçu :", data);
      document.getElementById("topBar").textContent = `👂 ${JSON.stringify(data)}`;
    });
  });

  peer.on("error", err => {
    console.error("❌ PeerJS", err);
    document.getElementById("topBar").textContent = `❌ Erreur PeerJS : ${err.type}`;
  });

  peer.on("disconnected", () => {
    document.getElementById("topBar").textContent = "⚠ Déconnecté du serveur PeerJS";
  });

  peer.on("close", () => {
    document.getElementById("topBar").textContent = "🔒 Connexion PeerJS fermée";
  });
}

export function nextMatch() {
  if (!window.myPeerId) {
    document.getElementById("topBar").textContent = "❌ Peer non initialisé";
    return;
  }

  document.getElementById("topBar").textContent = "🔄 Recherche d’un interlocuteur...";

  fetch(`/api/get-peer.php?callerId=${window.myPeerId}`)
    .then(r => r.json())
    .then(data => {
      if (data.partnerId) {
        document.getElementById("topBar").textContent = `🔗 Connexion à ${data.partnerId}`;
        const c = peer.connect(data.partnerId);
        c.on("open", () => {
          c.send({ hello: "👋 depuis " + window.myPeerId });
          document.getElementById("topBar").textContent = `✅ Connecté à ${data.partnerId}`;
        });
        c.on("data", d => {
          console.log("📨 Reçu :", d);
        });
      } else {
        document.getElementById("topBar").textContent = "❌ Aucun interlocuteur disponible";
      }
    })
    .catch(err => {
      document.getElementById("topBar").textContent = `❌ Erreur réseau : ${err.message}`;
      console.error("[MATCH]", err);
    });
}

export function bindMatchEvents() {
  const btnNext = document.getElementById("btnNext");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      nextMatch();
    });
  }
}
