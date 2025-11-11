#!/bin/bash

echo "🔄 Redémarrage des services LegalShuffleCam..."

echo "🚀 Redémarrage du serveur Node.js (legalshufflecam.service)..."
sudo systemctl restart legalshufflecam.service
sudo systemctl status legalshufflecam.service --no-pager

echo "❄️ Redémarrage du serveur Coturn (coturn.service)..."
sudo systemctl restart coturn.service
sudo systemctl status coturn.service --no-pager

echo "🔁 Reload de NGINX..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Tous les services ont été redémarrés."
