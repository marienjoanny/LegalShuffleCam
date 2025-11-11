#!/bin/bash

echo "🔍 Vérification du flux de signalement partenaire dans app.js..."

APPJS="public/app.js"

# 1. Vérifie socket.on("partner-info")
echo -n "🧠 Vérifie présence de socket.on('partner-info')... "
grep -q "socket.on(\"partner-info\"" "$APPJS" && echo "✅ OK" || echo "❌ Manquant"

# 2. Vérifie appel à capturePartnerSnapshot
echo -n "📸 Vérifie appel à capturePartnerSnapshot... "
grep -q "capturePartnerSnapshot(" "$APPJS" && echo "✅ OK" || echo "❌ Manquant"

# 3. Vérifie recentPartners.push ou unshift
echo -n "🧠 Vérifie mise à jour de recentPartners[]... "
grep -Eq "recentPartners\.(push|unshift)\(" "$APPJS" && echo "✅ OK" || echo "❌ Manquant"

# 4. Vérifie updateReportList()
echo -n "📋 Vérifie appel à updateReportList()... "
grep -q "updateReportList()" "$APPJS" && echo "✅ OK" || echo "❌ Manquant"

echo -e "\n✅ Vérification terminée."
