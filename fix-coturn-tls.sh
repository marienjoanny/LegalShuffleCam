#!/bin/bash

echo "🔧 Configuration TLS pour coturn..."

CONF="/etc/turnserver.conf"
DOMAIN="legalshufflecam.ovh"
CERT="/etc/letsencrypt/live/$DOMAIN/fullchain.pem"
PKEY="/etc/letsencrypt/live/$DOMAIN/privkey.pem"

if [ ! -f "$CERT" ] || [ ! -f "$PKEY" ]; then
  echo "❌ Certificats TLS manquants dans $CERT ou $PKEY"
  exit 1
fi

cat <<EOCONF > "$CONF"
listening-port=3478
tls-listening-port=5349
listening-ip=127.0.0.1
relay-ip=127.0.0.1

cert=$CERT
pkey=$PKEY

fingerprint
lt-cred-mech
realm=$DOMAIN
user=user:6945ea1ef73a87ff45116ae305ae019c36945d4d455a0f5bf44f24ad9efdb82c
EOCONF

echo "✅ Fichier $CONF mis à jour"

echo "🔄 Redémarrage de coturn..."
systemctl restart coturn && echo "✅ coturn redémarré" || echo "❌ Échec redémarrage"

echo "🔍 Test TLS sur port 5349..."
openssl s_client -connect 127.0.0.1:5349 < /dev/null || echo "❌ Échec TLS 5349"

echo "📜 Logs coturn en direct (Ctrl+C pour quitter)"
journalctl -u coturn.service -f
