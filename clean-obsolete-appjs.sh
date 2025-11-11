#!/bin/bash

echo "🧹 Nettoyage de app.js obsolète + vérification + commit/push..."

# 1. Supprime app.js racine s’il existe
if [ -f "app.js" ]; then
  echo "🗑️ Suppression de app.js à la racine..."
  rm -v app.js
else
  echo "✅ Aucun app.js à la racine"
fi

# 2. Vérifie que public/app.js existe
if [ ! -f "public/app.js" ]; then
  echo "❌ Fichier public/app.js introuvable. Abandon."
  exit 1
fi

# 3. Vérifie que le gestionnaire btnReport est bien présent
if grep -q "getElementById('btnReport')" public/app.js && grep -q "fetch(\"/api/report\"" public/app.js; then
  echo "✅ Gestionnaire btnReport détecté dans public/app.js"
else
  echo "❌ Gestionnaire btnReport manquant dans public/app.js. Abandon."
  exit 1
fi

# 4. Commit et push
echo "📦 Commit de public/app.js..."
git add public/app.js
git commit -m "✅ Version propre : suppression de app.js racine, vérification gestionnaire btnReport"
git push

echo "🚀 Push terminé avec succès."
