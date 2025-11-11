#!/bin/bash

echo "🧹 Suppression définitive de app.js à la racine + vérification + commit/push..."

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

# 4. Ajoute app.js à .gitignore s’il n’y est pas déjà
if ! grep -q "^app\.js$" .gitignore 2>/dev/null; then
  echo "📄 Ajout de app.js à .gitignore..."
  echo "app.js" >> .gitignore
  git add .gitignore
fi

# 5. Commit et push
echo "📦 Commit des changements..."
git add -u
git commit -m "🧹 Suppression définitive de app.js racine + vérification gestionnaire btnReport"
git push

echo "✅ Nettoyage terminé et synchronisé."
