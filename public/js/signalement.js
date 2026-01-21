// /public/js/signalement.js

/**
 * Capture un instantané de la vidéo distante.
 * @returns {string} Image au format base64 JPEG ou chaîne vide.
 */
function getRemoteVideoSnapshot() {
    const remoteVideo = document.getElementById('remoteVideo');
    const canvas = document.getElementById('screenshotCanvas');
    if (!remoteVideo || remoteVideo.paused || remoteVideo.ended || remoteVideo.videoWidth === 0) {
        console.warn("Impossible de prendre la capture: Vidéo distante non active/pas de dimensions.");
        return '';
    }
    canvas.width = remoteVideo.videoWidth;
    canvas.height = remoteVideo.videoHeight;
    canvas.getContext('2d').drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
}

/**
 * Envoie le signalement au serveur.
 * @param {string} partnerId L'ID du peer signalé.
 * @param {string} reason La raison du signalement.
 * @param {string} imageBase64 La capture d'écran (peut être vide).
 */
async function sendReport(partnerId, reason, imageBase64) {
    const callerId = window.myPeerId;
    const sessionId = window.currentSessionId;
    if (!callerId || !partnerId) {
        window.showTopbar("❌ Erreur: ID manquant pour le signalement.", "#a00");
        return;
    }
    const formData = new URLSearchParams();
    formData.append('callerId', callerId);
    formData.append('partnerId', partnerId);
    formData.append('reason', reason);
    formData.append('imageBase64', imageBase64);
    formData.append('sessionId', sessionId);
    window.showTopbar(`⏳ Envoi du signalement de ${partnerId}...`, "#f39c12");
    try {
        const response = await fetch('https://legalshufflecam.ovh/api/report-handler.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
        });
        if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
        const data = await response.json();
        if (data.status === 'success') {
            window.showTopbar(`✅ Signalement de ${partnerId.substring(0, 8)}... pour "${reason}" enregistré !`, "#2ecc71");
        } else {
            window.showTopbar(`❌ Échec de l'enregistrement: ${data.message || 'Erreur inconnue'}`, "#e74c3c");
            console.error("Report Handler Error:", data.message);
        }
    } catch (err) {
        window.showTopbar(`❌ Erreur réseau ou serveur. Voir console.`, "#e74c3c");
        console.error("Report Error:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const btnReport = document.getElementById('btnReport');
    const reportTargetSelect = document.getElementById('reportTarget');
    const otherReasonContainer = document.getElementById('otherReasonContainer');
    const otherReasonInput = document.getElementById('otherReasonInput');
    const submitOtherReason = document.getElementById('submitOtherReason');
    let report_peerId = null;
    let report_reason = null;
    const reasons = [
        { value: "Nudite", label: "Nudité (Violation de cadrage)" },
        { value: "Sexuel", label: "Comportement sexuel / explicite" },
        { value: "Harcèlement", label: "Harcèlement, Insultes, Discrimination" },
        { value: "Mineur", label: "Suspicion de minorité" },
        { value: "Fraude", label: "Fraude (Bot, Deepfake)" },
        { value: "Autre", label: "Autre (nécessite une description)" }
    ];

    /** Construit les options pour la sélection du pair à signaler. */
    window.buildPeerOptions = function() {
        const peerHistory = window.lastPeers;
        const peerHistoryCount = Object.keys(peerHistory).length;
        let optionsHTML = `<option value="" disabled selected>👤 Étape 1 : Choisir l'interlocuteur (${peerHistoryCount} trouvés)</option>`;
        const sortedPeers = Object.keys(peerHistory).sort((a, b) => peerHistory[b] - peerHistory[a]);
        sortedPeers.forEach(id => {
            if (id === window.myPeerId) return;
            // Correction de l'emoji manquant dans l'option: Utilisation du bon emoji 🔴
            const isCurrent = (id === window.currentPartnerId) ? ' (Actif 🔴)' : ''; 
            const timeAgoMs = Date.now() - peerHistory[id];
            const timeAgoSec = Math.floor(timeAgoMs / 1000);
            let timeText = timeAgoSec < 60 ? `il y a ${timeAgoSec} sec` : `il y a ${Math.floor(timeAgoSec / 60)} min`;
            optionsHTML += `<option value="ID|${id}">[${id.substring(0, 8)}] - ${timeText}${isCurrent}</option>`;
        });
        reportTargetSelect.innerHTML = optionsHTML;
        reportTargetSelect.size = Math.min(6, peerHistoryCount + 1);
    }

    /** Construit les options pour la sélection de la raison du signalement. */
    function buildReasonOptions() {
        const peerIdShort = report_peerId.substring(0, 8);
        const isCurrent = (report_peerId === window.currentPartnerId) ? ' (Capture vidéo possible)' : '';
        let optionsHTML = `<option value="" disabled selected>🚨 Raison pour ID: ${peerIdShort}...${isCurrent}</option><option value="" disabled>────────────────────────</option>`;
        reasons.forEach(r => {
            optionsHTML += `<option value="REASON|${r.value}">${r.label}</option>`;
        });
        reportTargetSelect.innerHTML = optionsHTML;
        reportTargetSelect.size = reasons.length + 2;
    }

    btnReport.addEventListener('click', () => {
        if (reportTargetSelect.classList.contains('visible')) {
            reportTargetSelect.classList.remove('visible');
            otherReasonContainer.style.display = 'none';
            window.showTopbar("Signalement annulé.", "#2980b9");
            report_peerId = null;
            return;
        }
        otherReasonContainer.style.display = 'none';
        window.buildPeerOptions(); // Appel de la fonction globalisée
        const peerHistoryCount = Object.keys(window.lastPeers).length;
        if (peerHistoryCount === 0) {
            window.showTopbar("⚠ Aucun interlocuteur récent ou actif à signaler.", "#fbbf24");
            return;
        }
        reportTargetSelect.classList.add('visible');
        window.showTopbar(`Sélectionnez un interlocuteur parmi les ${peerHistoryCount} derniers.`, "#2ecc71");
    });

    reportTargetSelect.addEventListener('change', async (event) => {
        const selectedValue = event.target.value;
        if (selectedValue.startsWith('ID|')) {
            report_peerId = selectedValue.substring(3);
            window.showTopbar(`Interlocuteur sélectionné ! Maintenant, choisissez la raison.`, "#f1c40f");
            buildReasonOptions();
            event.target.value = event.target.options[0].value;
            return;
        }
        if (selectedValue.startsWith('REASON|')) {
            report_reason = selectedValue.substring(7);
            if (!report_peerId) {
                window.showTopbar("⚠ Choisissez d'abord l'interlocuteur.", "#fbbf24");
                event.target.value = event.target.options[0].value;
                return;
            }
            if (report_reason === 'Autre') {
                reportTargetSelect.classList.remove('visible');
                otherReasonContainer.style.display = 'block';
                otherReasonInput.focus();
                window.showTopbar("Décrivez votre motif 'Autre' et envoyez.", "#3498db");
                event.target.value = event.target.options[0].value;
                return;
            }
            const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : '';
            await sendReport(report_peerId, report_reason, imageBase64);
            reportTargetSelect.classList.remove('visible');
            report_peerId = null;
            report_reason = null;
        }
    });

    submitOtherReason.addEventListener('click', async () => {
        const customReason = otherReasonInput.value.trim();
        if (customReason.length < 5) {
            window.showTopbar("⚠ La description doit contenir au moins 5 caractères.", "#fbbf24");
            return;
        }
        if (report_peerId && report_reason === 'Autre') {
            const finalReason = `Autre: ${customReason}`;
            const imageBase64 = (report_peerId === window.currentPartnerId) ? getRemoteVideoSnapshot() : '';
            await sendReport(report_peerId, finalReason, imageBase64);
            otherReasonContainer.style.display = 'none';
            otherReasonInput.value = '';
            report_peerId = null;
            report_reason = null;
        } else {
            window.showTopbar("❌ Erreur: Tentative d'envoi 'Autre' sans ID de pair ou sans motif.", "#e74c3c");
        }
    });
});
