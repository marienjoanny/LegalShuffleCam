#!/bin/bash

echo "🔍 Vérification complète de app.js..."

APPJS="public/app.js"

check() {
  local label="$1"
  local pattern="$2"
  echo -n "$label... "
  grep -Eq "$pattern" "$APPJS" && echo "✅ OK" || echo "❌ Manquant"
}

check "🧠 socket.on('partner-info')" 'socket\.on\(["'\'']partner-info["'\'']'
check "📸 capturePartnerSnapshot()" 'capturePartnerSnapshot\('
check "🧠 recentPartners[] modifié" 'recentPartners\.(push|unshift)\('
check "📋 updateReportList()" 'updateReportList\(\)'
check "🚩 reportBtn.addEventListener" 'reportBtn\.addEventListener'
check "🎥 remoteVideo présent" 'document\.getElementById\(["'\'']remoteVideo["'\'']\)'
check "📡 TURN config détecté" 'turns:'
check "🌐 STUN config détecté" 'stun:'
check "🧠 Détection visage (initFaceVisible)" 'initFaceVisible\('
check "🔌 connectSocketAndWebRTC()" 'connectSocketAndWebRTC\('
check "🧊 ICE candidate logging" 'onicecandidate'
check "📺 ontrack handler" 'ontrack\s*='

echo -e "\n✅ Vérification terminée."
