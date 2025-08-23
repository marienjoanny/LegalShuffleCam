
/* ==== FaceGuard integration (auto-hook) ==== */
(function () {
  if (!window.FaceGuard) {
    console.warn("[FaceGuard] script not loaded");
    return;
  }

  // Tente de récupérer un socket déjà existant, sinon créé à la volée
  function getSocket() {
    if (window.socket && typeof window.socket.emit === 'function') return window.socket;
    if (window.io && typeof window.io === 'function') {
      try { window.socket = window.io(); return window.socket; } catch {}
    }
    return null;
  }

  async function guardThen(fn, ctx, args) {
    const sock = getSocket();
    try {
      const res = await window.FaceGuard.enforce(sock, {
        videoElId: "localVideo",
        maxNoFaceSecs: 5,
        requireOnJoin: true
      });
      if (!res.allowed) {
        alert("Visage requis pour rejoindre.");
        try { sock?.emit?.("face:violation", { reason: res.reason || "blocked" }); } catch {}
        return;
      }
    } catch (e) {
      console.warn("[FaceGuard] erreur, on laisse passer par défaut:", e);
    }
    return fn && fn.apply(ctx, args || []);
  }

  // 1) Si une fonction globale join() existe, on la wrappe
  if (typeof window.join === 'function') {
    const _origJoin = window.join;
    window.join = function (...a) { return guardThen(_origJoin, this, a); };
    console.log("[FaceGuard] join() hooké");
  } else {
    // 2) Sinon, on essaye d'accrocher le bouton #joinBtn
    window.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('joinBtn');
      if (btn) {
        const handler = async (e) => {
          e.preventDefault();
          await guardThen(null, null, null); // juste l’enforcement + events
          // Si tu as une logique de join côté bouton, ajoute-la ici si besoin
        };
        btn.addEventListener('click', handler, { once: false });
        console.log("[FaceGuard] bouton #joinBtn hooké");
      }
    });
  }
})();

// === DEBUG MATCH CLIENT ===
(() => {
  try {
    const getSocket = () => {
      if (window.socket && typeof window.socket.on === 'function') return window.socket;
      if (window.io) { window.socket = window.io(); return window.socket; }
      return null;
    };
    const s = getSocket();
    if (!s) { console.warn('[MATCH][client] socket.io introuvable'); return; }

    let bound = s.__matchDebugBound;
    if (bound) return;
    s.__matchDebugBound = true;

    s.on('waiting', () => {
      console.log('[MATCH][client] waiting reçu');
      try {
        const btn = document.getElementById('btnJoin') || document.getElementById('joinBtn');
        if (btn) { btn.textContent = 'En attente…'; btn.disabled = true; }
      } catch {}
    });

    s.on('matched', (payload) => {
      console.log('[MATCH][client] matched reçu', payload);
      try {
        const btn = document.getElementById('btnJoin') || document.getElementById('joinBtn');
        if (btn) { btn.textContent = 'Connecté !'; btn.disabled = true; }
      } catch {}
      // TODO: ta logique WebRTC peut partir d’ici (createOffer/Answer…)
      // Pour l’instant, on montre au moins un feedback :
      try { alert('Match trouvé — room: ' + payload?.roomId); } catch {}
    });
  } catch(e) {
    console.error('[MATCH][client] error', e);
  }
})();
