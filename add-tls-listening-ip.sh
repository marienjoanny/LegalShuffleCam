#!/bin/bash

CONF="/etc/turnserver.conf"
IP1="127.0.0.1"
IP2=$(hostname -I | awk '{print $1}')

echo "🔍 Ajout des lignes tls-listening-ip dans $CONF..."

grep -q "tls-listening-ip=$IP1" $CONF || echo "tls-listening-ip=$IP1" >> $CONF
grep -q "tls-listening-ip=$IP2" $CONF || echo "tls-listening-ip=$IP2" >> $CONF

echo "✅ Lignes ajoutées :"
echo "  tls-listening-ip=$IP1"
echo "  tls-listening-ip=$IP2"

echo "🔄 Redémarrage de coturn..."
systemctl restart coturn && echo "✅ coturn redémarré" || echo "❌ Échec redémarrage"

echo "📡 Vérification écoute réseau sur 5349..."
ss -tulnp | grep 5349 || echo "❌ Port 5349 non ouvert"

echo "🔍 Test TLS local sur 5349..."
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"
