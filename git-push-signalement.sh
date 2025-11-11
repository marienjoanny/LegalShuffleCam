#!/bin/bash

REPO_DIR="/var/www/legalshufflecam"
cd "$REPO_DIR" || exit 1

echo "🔍 Vérification des modifications..."
if git diff --quiet && git diff --cached --quiet; then
  echo "📭 Aucun changement à committer."
  exit 0
fi

echo "📦 Ajout des fichiers modifiés..."
[ -f process-reports.sh ] && git add process-reports.sh
[ -f setup-node-service.sh ] && git add setup-node-service.sh

echo "📁 Ajout des fichiers de service systemd..."
mkdir -p deploy
cp /etc/systemd/system/legalshufflecam*.service deploy/ 2>/dev/null
git add deploy/legalshufflecam*.service

echo "📝 Commit avec message..."
git commit -m "Ajout script signalement + service Node.js auto-reload"

echo "🚀 Push vers le dépôt distant..."
git push origin main

echo "✅ Commit et push terminés."
