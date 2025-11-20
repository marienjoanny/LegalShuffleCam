/**
 * Fichier de gestion de la logique de signalement des interlocuteurs.
 * Contient la gestion de l'historique local, du sélecteur d'options, 
 * de la capture d'écran, et de l'envoi du signalement à l'API.
 */

const MAX_HISTORY = 5;
window.lastPeers = JSON.parse(localStorage.getItem('lastPeers')) || {};

export function updateLastPeers(newPeerId) {
    if (!newPeerId) return;
    window.lastPeers[newPeerId] = Date.now(); 
    let peerArray = Object.entries(window.lastPeers).sort((a, b) => b[1] - a[1]);
    if (peerArray.length > MAX_HISTORY) peerArray = peerArray.slice(0, MAX_HISTORY);
    window.lastPeers = Object.fromEntries(peerArray);
    localStorage.setItem('lastPeers', JSON.stringify(window.lastPeers));
}
window.updateLastPeers = updateLastPeers;

function getRemoteVideoSnapshot() {
    const remoteVideo = document.getElementById('remoteVideo');
    if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) return '';
    const canvas = document.createElement('canvas');
    canvas.width = remoteVideo.videoWidth;
    canvas.height = remoteVideo.videoHeight;
    canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8); 
}

export function initReportEvents() {
    const btnReport = document.getElementById('btnReport');
    const reportTargetSelect = document.getElementById('reportTarget');
    let report_peerId = null, report_reason = null;

    btnReport.addEventListener('click', () => {
        const peerHistory = window.lastPeers;
        if (Object.keys(peerHistory).length === 0) {
            window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
            reportTargetSelect.classList.remove('visible');
            return;
        }
        reportTargetSelect.classList.toggle('visible');
        if (reportTargetSelect.classList.contains('visible')) {
            let optionsHTML = '<option value="" disabled selected>👤 Choisir l\'interlocuteur à signaler</option>';
            Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]).forEach(id => {
                const isCurrent = (id === window.currentPartnerId) ? ' (Actif)' : '';
                const timeAgo = (Date.now() - peerHistory[id]) / 60000;
                const timeText = timeAgo < 1 ? 'moins d\'une minute' : `${Math.floor(timeAgo)} min`;
                optionsHTML += `<option value="ID|${id}">${id}${isCurrent} (${timeText} ago)</option>`;
            });
            optionsHTML += '<option value="" disabled>--- Raison du signalement ---</option>';
            optionsHTML += '<option value="REASON|Nudite">Nudité (Violation de cadrage)</option>';
            optionsHTML += '<option value="REASON|Sexuel">Comportement sexuel / explicite</option>';
            optionsHTML += '<option value="REASON|Harcèlement">Harcèlement, Insultes, Discrimination</option>';
            optionsHTML += '<option value="REASON|Mineur">Suspicion de minorité</option>';
            optionsHTML += '<option value="REASON|Fraude">Fraude (Bot, Deepfake)</option>';
            optionsHTML += '<option value="REASON|Autre">Autre</option>';
            reportTargetSelect.innerHTML = optionsHTML;
        }
    });

    reportTargetSelect.addEventListener('change', async (event) => {
        const selectedValue = event.target.value;
        if (selectedValue.startsWith('ID|')) {
            report_peerId = selectedValue.substring(3);
            window.showTopbar(`Interlocuteur sélectionné : ${report_peerId}. Choisissez maintenant la raison.`, "#2ecc71");
            return;
        } else if (selectedValue.startsWith('REASON|')) {
            report_reason = selectedValue.substring(7);
            window.showTopbar(`Raison sélectionnée : ${report_reason}. Tentative d'envoi...`, "#f1c40f");
        } else return;

        if (report_peerId && report_reason) {
            const callerId = window.myPeerId;
            const partnerId = report_peerId;
            const reason = report_reason;
            const sessionId = window.currentSessionId || 'N/A';
            const imageBase64 = (partnerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : '';
            if (!callerId || !partnerId) {
                window.showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
                reportTargetSelect.classList.remove('visible');
                report_peerId = null; report_reason = null;
                return;
            }
            const formData = new URLSearchParams();
            formData.append('callerId', callerId);
            formData.append('partnerId', partnerId);
            formData.append('reason', reason);
            formData.append('imageBase64', imageBase64);
            formData.append('sessionId', sessionId);
            try {
                const response = await fetch('/api/report-handler.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData,
                });
                const data = await response.json();
                if (data.status === 'success') {
                    window.showTopbar(`✅ Signalement de ${partnerId} pour ${reason} envoyé !`, "#0a0");
                } else {
                    window.showTopbar("❌ Échec de l'enregistrement du signalement.", "#a00");
                }
            } catch (err) {
                window.showTopbar("❌ Erreur réseau lors du signalement.", "#a00");
                console.error("Report Error:", err);
            }
            reportTargetSelect.classList.remove('visible');
            report_peerId = null;
            report_reason = null;
        }
    });
}
