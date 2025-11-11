#!/bin/bash

echo "🔍 Diagnostic Git — $(date)"
echo "----------------------------------"

# 1. Vérifie si un dossier .git existe dans les répertoires web classiques
for dir in /var/www /var/www/html /srv/http /usr/share/nginx/html; do
  if [ -d "$dir/.git" ]; then
    echo "⚠️  Dossier .git trouvé dans : $dir"
  fi
done

# 2. Teste si .git/config est accessible en HTTP local
echo -n "🌐 Test HTTP /.git/config : "
code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/.git/config)
if [ "$code" = "200" ]; then
  echo "❌ ACCESSIBLE (code 200)"
elif [ "$code" = "301" ] || [ "$code" = "302" ]; then
  echo "🔁 Redirigé (code $code)"
else
  echo "✅ Non accessible (code $code)"
fi

# 3. Vérifie les permissions sur les fichiers Git
if [ -d ".git" ]; then
  echo "🔐 Permissions sur .git/config :"
  ls -l .git/config
fi

# 4. Vérifie si un dépôt Git est initialisé ici
if git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "📦 Dépôt Git détecté dans $(pwd)"
  echo "🔗 Remote : $(git remote -v | awk '{print $2}' | head -n1)"
else
  echo "ℹ️  Aucun dépôt Git dans $(pwd)"
fi

echo "✅ Diagnostic terminé."
