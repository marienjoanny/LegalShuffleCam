/**
 * Face Guard — détection visage (FaceDetector natif -> fallback BlazeFace UMD)
 * - Active #joinBtn quand un visage est bien cadré quelques frames d'affilée
 * - Tolère l’absence de certains éléments (ne plante pas)
 */
(function () {
  const video  = document.getElementById('localVideo');
  const joinBtn = document.getElementById('joinBtn');
  const testBtn = document.getElementById('testDetectBtn'); // optionnel s'il existe
  const frameEl = document.getElementById('faceFrame') || video?.parentElement;

  // helpers UI
  function setFrameOK(ok) {
    if (!frameEl) return;
    frameEl.style.boxShadow = ok
      ? '0 0 0 6px #20c997 inset, 0 0 0 12px #0f5132 inset'
      : '0 0 0 6px #ff6b6b inset, 0 0 0 12px #842029 inset';
    frameEl.style.borderRadius = '16px';
  }
  function setJoinEnabled(en) {
    if (!joinBtn) return;
    joinBtn.disabled = !en;
    joinBtn.style.opacity = en ? '1' : '0.6';
  }
  setFrameOK(false);
  setJoinEnabled(false);

  // Caméra
  async function ensureCamera() {
    if (!video) return;
    if (video.srcObject) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      await video.play().catch(()=>{});
    } catch (e) {
      alert('Caméra indisponible: ' + e.message);
      throw e;
    }
  }

  // Détecteurs
  let mode = 'none';
  let nativeFD = null;
  let blazeModel = null;

  async function getDetector() {
    // 1) FaceDetector natif
    if ('FaceDetector' in window) {
      try {
        nativeFD = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
        mode = 'facedetector';
        return { type: mode, detect: async (v) => nativeFD.detect(v) };
      } catch (_) { nativeFD = null; }
    }

    // 2) Fallback: BlazeFace (via fg-blaze-loader.js)
    // S'assure que le loader a été inclus
    if (!window.__fgBlazeReady) {
      // injection de secours si l’index n’a pas inclus le loader
      const s = document.createElement('script');
      s.src = '/js/fg-blaze-loader.js';
      s.defer = true;
      document.head.appendChild(s);
      await new Promise(res => s.onload = res);
    }
    try {
      await window.__fgBlazeReady;
      if (!window.blazeface) throw new Error('blazeface missing');
      blazeModel = await window.blazeface.load();
      mode = 'blazeface';
      return {
        type: mode,
        detect: async (v) => {
          const preds = await blazeModel.estimateFaces(v, false);
          // normalise vers un format {box:{x,y,width,height}, probability}
          return (preds || []).map(p => {
            const tl = Array.isArray(p.topLeft) ? p.topLeft :
                       (p.topLeft?.arraySync?.() || [p.topLeft[0], p.topLeft[1]]);
            const br = Array.isArray(p.bottomRight) ? p.bottomRight :
                       (p.bottomRight?.arraySync?.() || [p.bottomRight[0], p.bottomRight[1]]);
            const x = tl[0], y = tl[1];
            const width  = Math.max(0, br[0] - tl[0]);
            const height = Math.max(0, br[1] - tl[1]);
            return { box: { x, y, width, height }, probability: p.probability ? p.probability[0] : 0.9 };
          });
        }
      };
    } catch (e) {
      alert('Impossible de charger la détection (fallback): ' + e.message);
      throw e;
    }
  }

  // Critères cadrage
  function isCentered(face, vw, vh) {
    if (!face) return false;
    const cx = face.x + face.width / 2;
    const cy = face.y + face.height / 2;
    const area = (face.width * face.height) / (vw * vh);

    // tolérances
    const centerTolX = vw * 0.20; // 20% autour du centre
    const centerTolY = vh * 0.22;
    const minArea = 0.10;         // >= 10% de l’image

    const okCenter =
      Math.abs(cx - vw / 2) <= centerTolX &&
      Math.abs(cy - vh / 2) <= centerTolY;
    const okArea = area >= minArea;
    return okCenter && okArea;
  }

  let okStreak = 0;
  let detector = null;
  let rafId = 0;

  async function loop() {
    try {
      await ensureCamera();
      detector = detector || await getDetector();
      if (!video || video.readyState < 2) {
        setFrameOK(false);
        setJoinEnabled(false);
        rafId = requestAnimationFrame(loop);
        return;
    }

      const vw = video.videoWidth || 0;
      const vh = video.videoHeight || 0;

      let faces = [];
      try {
        if (detector?.detect) {
          const raw = await detector.detect(video);
          if (detector.type === 'facedetector') {
            faces = (raw || []).map(f => ({
              box: f.boundingBox || f, probability: f.probability || 0.9
            }));
          } else {
            faces = raw || [];
          }
        }
      } catch {
        // une frame peut échouer, on ignore
      }

      const face = faces[0]?.box;
      const ok = isCentered(face, vw, vh);

      if (ok) {
        okStreak = Math.min(okStreak + 1, 8);
      } else {
        okStreak = Math.max(okStreak - 1, 0);
      }
      const passed = okStreak >= 3; // 3 frames OK consécutives

      setFrameOK(passed);
      setJoinEnabled(passed);
    } catch (e) {
      console.error(e);
      setFrameOK(false);
      setJoinEnabled(false);
    } finally {
      rafId = requestAnimationFrame(loop);
    }
  }

  // Bouton test (optionnel)
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      try {
        await ensureCamera();
        detector = detector || await getDetector();
        const res = await detector.detect(video);
        alert(`Détection: ${res && res.length ? 'OK (' + res.length + ')' : 'aucun visage'}`);
      } catch (e) {
        alert('Erreur test: ' + e.message);
      }
    });
  }

  // démarre
  window.addEventListener('pageshow', () => { if (!rafId) loop(); });
  window.addEventListener('pagehide', () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; });
})();
