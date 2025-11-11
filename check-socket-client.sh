#!/bin/bash

echo "🔍 Vérification de l'inclusion du client Socket.IO dans index-real.php..."

FILE="public/index-real.php"

# Vérifie que socket.io.min.js est inclus
if grep -q 'socket.io.min.js' "$FILE"; then
  echo "✅  socket.io.min.js est bien inclus dans index-real.php."
else
  echo "❌  socket.io.min.js n'est pas inclus. Ajoute :"
  echo '<script src="/socket.io/socket.io.min.js"></script>'
  exit 1
fi

echo
echo "🧪 Pour tester côté navigateur, ouvre la console (F12) et tape :"
echo "   typeof io"
echo "→ Si ça retourne 'function', le client Socket.IO est bien chargé."
echo "→ Si 'undefined', le script n'est pas chargé ou mal référencé."
