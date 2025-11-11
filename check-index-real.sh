#!/bin/bash

echo "🔍 Vérification de index-real.php"

echo -e "\n1️⃣ Chargement de socket.io.js"
grep -n 'socket.io' public/index-real.php || echo "❌ socket.io.js non chargé"

echo -e "\n2️⃣ Chargement de app.js"
grep -n 'app.js' public/index-real.php || echo "❌ app.js non chargé"

echo -e "\n3️⃣ Appel de connectSocketAndWebRTC(localStream)"
grep -n 'connectSocketAndWebRTC' public/index-real.php || echo "❌ connectSocketAndWebRTC non appelé"

echo -e "\n✅ Vérification terminée"
