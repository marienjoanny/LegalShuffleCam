#!/bin/bash

echo "🔍 Vérification client app.js"

echo -e "\n1️⃣ Appel de connectSocketAndWebRTC(localStream)"
grep -n 'connectSocketAndWebRTC(localStream)' public/app.js || echo "❌ Pas d'appel détecté"

echo -e "\n2️⃣ Émission de ready-for-match"
grep -n "socket.emit('ready-for-match')" public/app.js || echo "❌ socket.emit('ready-for-match') absent"

echo -e "\n3️⃣ Écoute de match-found"
grep -n "socket.on('match-found'" public/app.js || echo "❌ socket.on('match-found') absent"

echo -e "\n✅ Vérification terminée"
