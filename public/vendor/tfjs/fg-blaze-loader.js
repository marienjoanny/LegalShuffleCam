(function () {
  if (window.__fgBlazeReady) return; // déjà lancé
  console.log('[FG] loader start');

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Fail load ' + src)); };
      document.head.appendChild(s);
    });
  }

  async function ensureTF() {
    if (window.tf && window.tf.version) return;
    console.log('[FG] loading tf.min.js …');
    await loadScript('/vendor/tfjs/tf.min.js');
    console.log('[FG] tf.min.js loaded, version:', (window.tf && tf.version && tf.version.tfjs) || 'unknown');
  }

  async function ensureBlaze() {
    if (window.blazeface && typeof window.blazeface.load === 'function') return;
    console.log('[FG] loading blazeface.min.js …');
    await loadScript('/vendor/tfjs/blazeface.min.js');
    if (!window.blazeface) throw new Error('blazeface global missing after load');
    console.log('[FG] blazeface script loaded');
  }

  window.__fgBlazeReady = (async () => {
    await ensureTF();
    await ensureBlaze();
    console.log('[FG] calling blazeface.load({ modelUrl: '/models/blazeface/model.json' }) …');
    const model = await window.blazeface.load({ modelUrl: '/models/blazeface/model.json' });
    if (!model || typeof model.estimateFaces !== 'function') {
      throw new Error('blazeface model invalid');
    }
    window.__fgBlazeModel = model;
    console.log('[FG] blazeface model ready ✅');
    return model;
  })().catch(err => {
    console.error('[FG] loader error:', err);
    throw err;
  });
})();
