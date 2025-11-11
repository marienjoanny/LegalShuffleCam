#!/bin/bash

APP_JS="public/app.js"
echo "🔍 Vérification de l'intégrité de $APP_JS..."

check() {
  local label="$1"
  local pattern="$2"
  if grep -q "$pattern" "$APP_JS"; then
    echo "✅ $label"
  else
    echo "❌ $label manquant"
  fi
}

check "btnReport présent" "getElementById('btnReport')"
check "reportSelect présent" "getElementById('reportTarget')"
check "remoteVideo présent" "getElementById('remoteVideo')"
check "localVideo présent" "getElementById('localVideo')"
check "cameraSelect présent" "getElementById('cameraSelect')"
check "btnNext présent" "getElementById('btnNext')"
check "btnMic présent" "getElementById('btnMic')"
check "Tableau recentPartners" "const recentPartners ="
check "Fonction capturePartnerSnapshot" "function capturePartnerSnapshot"
check "Fonction updateReportList" "function updateReportList"
check "Gestionnaire reportBtn" "reportBtn.addEventListener"
check "Appel fetch /api/report" "fetch(\"/api/report\""
check "TURN Coturn dans rtcConfig" "turn:legalshufflecam.ovh"

echo "🧪 Vérification terminée."
