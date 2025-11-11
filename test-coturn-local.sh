#!/bin/bash

echo "🔍 Test coturn local"

echo "📦 Vérification du service coturn..."
systemctl is-active coturn && echo "✅ coturn est actif" || echo "❌ coturn est inactif"

echo "📡 Test UDP sur port 3478..."
echo "Test coturn" | nc -u -v -w 2 127.0.0.1 3478 || echo "❌ Échec UDP 3478"

echo "🔐 Test TCP sur port 3478..."
openssl s_client -connect 127.0.0.1:3478 < /dev/null || echo "❌ Échec TCP 3478"

echo "📄 Vérification du fichier de config coturn..."
test -f /etc/turnserver.conf && echo "✅ /etc/turnserver.conf présent" || echo "❌ Fichier de config manquant"

echo "📺 Pour tester les candidats relay dans WebRTC :"
echo "→ Ajoute dans app.js :"
echo "   peerConnection.onicecandidate = (e) => { if (e.candidate && e.candidate.candidate.includes('relay')) alert('✅ TURN utilisé'); };"

echo "📜 Logs coturn en direct :"
echo "→ Ctrl+C pour quitter"
journalctl -u coturn.service -f
