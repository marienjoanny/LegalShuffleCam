#!/bin/bash

echo "🔍 Vérification complète de LegalShuffleCam..."

# 1. Vérifie que le port 3000 est ouvert dans le pare-feu
echo -n "🛡️  Port 3000 dans le pare-feu : "
if sudo ufw status | grep -q '3000.*ALLOW'; then
  echo "✅ OUVERT"
else
  echo "❌ FERMÉ — exécute : sudo ufw allow 3000/tcp"
fi

# 2. Vérifie que Node.js écoute sur 0.0.0.0
echo -n "📡 Node.js écoute sur 0.0.0.0 : "
if grep -q "server.listen.*0.0.0.0" server.js; then
  echo "✅ OK"
else
  echo "❌ NON — modifie server.js pour écouter sur 0.0.0.0"
fi

# 3. Vérifie que HTTPS est utilisé
echo -n "🔐 HTTPS activé dans server.js : "
if grep -q 'https.createServer' server.js; then
  echo "✅ OK"
else
  echo "❌ NON — utilise https.createServer avec tes certificats"
fi

# 4. Vérifie que les certificats SSL sont présents
echo -n "📁 Certificats SSL Let’s Encrypt : "
if [ -f /etc/letsencrypt/live/legalshufflecam.ovh/fullchain.pem ] && [ -f /etc/letsencrypt/live/legalshufflecam.ovh/privkey.pem ]; then
  echo "✅ PRÉSENTS"
else
  echo "❌ MANQUANTS — exécute certbot pour générer les certificats"
fi

# 5. Vérifie que socket.io.min.js est inclus dans index-real.php
echo -n "📦 socket.io.min.js dans index-real.php : "
if grep -q 'socket.io.min.js' public/index-real.php; then
  echo "✅ INCLUS"
else
  echo "❌ ABSENT — ajoute : <script src=\"/socket.io/socket.io.min.js\"></script>"
fi

# 6. Vérifie que app.js est inclus
echo -n "📦 app.js dans index-real.php : "
if grep -q '<script src="app.js">' public/index-real.php; then
  echo "✅ INCLUS"
else
  echo "❌ ABSENT — ajoute : <script src=\"app.js\"></script>"
fi

# 7. Vérifie que connectSocketAndWebRTC est défini globalement
echo -n "🧠 connectSocketAndWebRTC exposée via window : "
if grep -q 'window.connectSocketAndWebRTC' public/app.js; then
  echo "✅ OK"
else
  echo "❌ NON — ajoute window.connectSocketAndWebRTC = function(...) dans app.js"
fi

# 8. Vérifie que io() est utilisé sans hardcoding
echo -n "🌐 Appel à io() sans URL dans app.js : "
if grep -q 'const socket = io();' public/app.js; then
  echo "✅ OK"
else
  echo "❌ NON — remplace par const socket = io();"
fi

echo
echo "✅ Vérification terminée. Corrige les ❌ pour assurer le bon fonctionnement sécurisé de LegalShuffleCam."
