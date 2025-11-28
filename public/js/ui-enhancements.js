// /public/js/ui-enhancements.js (Améliorations de l'interface et sécurité light)

document.addEventListener('DOMContentLoaded', () => {
    const remoteVideo = document.getElementById('remoteVideo');
    const videoObscuredMessage = document.getElementById('videoObscuredMessage');

    // --- 1. Mesures de dissuasion (Bloque clic droit et F12/DevTools) ---
    document.addEventListener('contextmenu', (e) => { e.preventDefault(); });
    document.addEventListener('keydown', (e) => {
        // Bloque F12, Ctrl+Shift+I/Meta+Shift+I pour empêcher l'ouverture des DevTools
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.metaKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
        }
    });

    // --- 2. Masquage de la vidéo si l'onglet n'est pas actif ---
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'hidden') {
            if (remoteVideo) {
                remoteVideo.style.opacity = '0';
                remoteVideo.style.pointerEvents = 'none';
            }
            if (videoObscuredMessage) {
                videoObscuredMessage.style.display = 'block';
            }
        } else {
            if (remoteVideo) {
                remoteVideo.style.opacity = '1';
                remoteVideo.style.pointerEvents = 'auto';
            }
            if (videoObscuredMessage) {
                videoObscuredMessage.style.display = 'none';
            }
        }
    });
});
