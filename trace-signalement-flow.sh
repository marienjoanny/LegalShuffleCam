#!/bin/bash

echo "🔍 Trace complète du signalement LegalShuffleCam"

echo "📁 Étape 1 : Vérifie présence du bouton dans public/app.js"
grep "getElementById('btnReport')" public/app.js || echo "❌ btnReport introuvable"

echo "📁 Étape 2 : Vérifie présence du select reportTarget"
grep "getElementById('reportTarget')" public/app.js || echo "❌ reportTarget introuvable"

echo "📁 Étape 3 : Vérifie gestionnaire reportBtn"
grep "reportBtn.addEventListener" public/app.js || echo "❌ Aucun gestionnaire reportBtn"

echo "📁 Étape 4 : Vérifie appel à fetch /api/report"
grep "fetch(\"/api/report\"" public/app.js || echo "❌ Aucun fetch /api/report"

echo "📁 Étape 5 : Vérifie capturePartnerSnapshot"
grep "function capturePartnerSnapshot" public/app.js || echo "❌ capturePartnerSnapshot manquant"

echo "📁 Étape 6 : Vérifie socket.on('partner-info')"
grep "socket.on(\"partner-info\"" public/app.js || echo "❌ socket.on('partner-info') manquant"

echo "📁 Étape 7 : Vérifie route serveur /api/report"
grep "app.post(\"/api/report\"" server.js || echo "❌ Route /api/report absente dans server.js"

echo "📁 Étape 8 : Vérifie log serveur 📥"
grep "Signalement reçu" server.js || echo "⚠️ Aucun log 'Signalement reçu' dans server.js"

echo "✅ Trace terminée."
