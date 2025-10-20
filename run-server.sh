#!/bin/bash

cd /var/www/legalshufflecam || exit 1
mkdir -p logs

echo "🚀 Démarrage LegalShuffleCam server.js à $(date)"
node server.js | tee -a logs/server.log
