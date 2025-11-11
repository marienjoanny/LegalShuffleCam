#!/bin/bash

echo "🔍 Vérification de la redéclaration de remoteVideo dans app.js..."

LIGNE=$(grep -n 'const remoteVideo' public/app.js | cut -d: -f1)

if [ -n "$LIGNE" ]; then
  echo "❌ Redéclaration détectée à la ligne $LIGNE"
  echo "🛠️  Application du patch : remplacement par let remoteVideo..."
  sed -i 's|const remoteVideo =|let remoteVideo =|' public/app.js
  echo "✅ Patch appliqué avec succès."
else
  echo "✅ Aucun const remoteVideo trouvé. Rien à corriger."
fi
