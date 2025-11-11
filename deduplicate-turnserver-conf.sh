#!/bin/bash

CONF="/etc/turnserver.conf"
TMP="/tmp/turnserver.conf.cleaned"

echo "🧼 Nettoyage des doublons dans $CONF..."

# Supprime les doublons exacts
awk '!seen[$0]++' "$CONF" > "$TMP"

# Remplace le fichier original
cp "$CONF" "$CONF.backup.$(date +%Y%m%d-%H%M%S)"
mv "$TMP" "$CONF"

echo "✅ Fichier nettoyé et sauvegardé"

echo "🔄 Redémarrage de coturn..."
systemctl restart coturn && echo "✅ coturn redémarré" || echo "❌ Échec redémarrage"

echo "📡 Vérification écoute réseau sur 5349..."
ss -tulnp | grep 5349 || echo "❌ Port 5349 non ouvert"

echo "🔍 Test TLS local sur 5349..."
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"
